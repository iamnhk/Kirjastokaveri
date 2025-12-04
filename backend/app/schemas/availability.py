"""Pydantic schemas for availability data."""

import html
from typing import Any, Iterable

from bs4 import BeautifulSoup
from pydantic import BaseModel

_FINNA_RECORD_URL_TEMPLATE = "https://www.finna.fi/Record/{record_id}"
_PLACEHOLDER_TOKEN = "__HOLDINGSSUMMARYLOCATION__"
_STATUS_MAPPING = {
    "available": "Available",
    "unavailable": "On Loan",
    "onloan": "On Loan",
}


def _normalise_whitespace(value: str) -> str:
    """Normalize whitespace and decode HTML entities."""
    decoded = html.unescape(value)
    return " ".join(decoded.replace("\xa0", " ").split())


def _text_from_html(value: str | None) -> str:
    """Extract text content from HTML."""
    if not value:
        return ""
    soup = BeautifulSoup(value, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    return _normalise_whitespace(text)


def _normalise_call_number(value: str) -> str:
    """Normalize call number by removing common prefixes."""
    if not value:
        return ""
    cleaned = value.strip()
    prefixes = ("Hylly:", "Shelf:", "Call number:", "Signum:")
    for prefix in prefixes:
        if cleaned.lower().startswith(prefix.lower()):
            cleaned = cleaned[len(prefix) :].strip()
            break
    return _normalise_whitespace(cleaned)


def _parse_holdings_from_html(html_content: str | None) -> list[tuple[str, str]]:
    """Parse holdings information from HTML content."""
    if not html_content:
        return []
    soup = BeautifulSoup(html_content, "html.parser")
    holdings: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()

    for location_div in soup.select("div.groupLocation"):
        location_text = _normalise_whitespace(
            location_div.get_text(separator=" ", strip=True)
        )
        if not location_text or _PLACEHOLDER_TOKEN in location_text:
            continue
        call_div = location_div.find_next_sibling("div", class_="groupCallnumber")
        call_text = ""
        if call_div:
            call_text = _normalise_whitespace(
                call_div.get_text(separator=" ", strip=True)
            )
        call_text = _normalise_call_number(call_text)
        key = (location_text, call_text)
        if key in seen:
            continue
        seen.add(key)
        holdings.append((location_text, call_text))

    if holdings:
        return holdings

    for row in soup.select(
        "table.holdings-status tbody tr, table.holdings-status tr"
    ):
        cells = [
            _normalise_whitespace(cell.get_text(separator=" ", strip=True))
            for cell in row.find_all("td")
        ]
        if len(cells) < 2:
            continue
        library = cells[0]
        location = cells[1] if len(cells) > 1 else ""
        call_number = cells[3] if len(cells) > 3 else ""
        location_value = location or library
        call_number = _normalise_call_number(call_number)
        key = (location_value, call_number)
        if (not location_value and not call_number) or key in seen:
            continue
        seen.add(key)
        holdings.append((location_value, call_number))

    return holdings


def _normalize_status(availability: Any, availability_message: str | None) -> str:
    """Normalize availability status string."""
    if isinstance(availability, str):
        normalized = availability.lower()
        if normalized in _STATUS_MAPPING:
            return _STATUS_MAPPING[normalized]
        return _normalise_whitespace(availability.title())
    message_text = _text_from_html(availability_message)
    if message_text:
        return message_text
    return "Unknown"


def _build_item_payloads(
    record_id: str, status_entry: dict[str, Any]
) -> list[dict[str, Any]]:
    """Build item payloads from status entry."""
    status_text = _normalize_status(
        status_entry.get("availability"), status_entry.get("availability_message")
    )
    holdings = _parse_holdings_from_html(status_entry.get("locationList"))
    if not holdings:
        holdings = _parse_holdings_from_html(status_entry.get("full_status"))
    if not holdings:
        fallback = _text_from_html(status_entry.get("availability_message"))
        if fallback:
            holdings = [(fallback, "")]
    if not holdings:
        holdings = [("Unknown", "")]

    url = status_entry.get("url") or _FINNA_RECORD_URL_TEMPLATE.format(
        record_id=record_id
    )
    items: list[dict[str, Any]] = []
    seen: set[tuple[str | None, str | None]] = set()
    for library, location in holdings:
        payload = {
            "library": library or "Unknown",
            "location": location or None,
            "status": status_text,
            "url": url,
        }
        key = (payload["library"], payload["location"])
        if key in seen:
            continue
        seen.add(key)
        items.append(payload)
    return items


def _iter_status_entries(statuses: Any) -> Iterable[dict[str, Any]]:
    """Iterate over status entries from various formats."""
    if isinstance(statuses, list):
        for entry in statuses:
            if isinstance(entry, dict):
                yield entry
    elif isinstance(statuses, dict):
        for entry in statuses.values():
            if isinstance(entry, dict):
                yield entry


class AvailabilityItem(BaseModel):
    """Individual availability item for a library location."""

    library: str
    location: str | None = None
    status: str
    url: str | None = None
    distance_km: float | None = None  # Distance from user location in kilometers
    available_count: int = 0  # Number of available copies at this location
    total_count: int = 1  # Total copies at this location
    call_number: str | None = None  # Call number / shelf location

    @classmethod
    def from_finna(cls, payload: dict[str, Any]) -> "AvailabilityItem":
        """Create an AvailabilityItem from Finna API response."""
        library_raw = payload.get("library") or payload.get("name")
        if isinstance(library_raw, dict):
            library_name = library_raw.get("translated") or library_raw.get("value")
        else:
            library_name = library_raw
        if isinstance(library_name, str):
            library_name = _normalise_whitespace(library_name)

        location_raw = payload.get("location") or payload.get("collection")
        if isinstance(location_raw, dict):
            location_value = location_raw.get("translated") or location_raw.get("value")
        else:
            location_value = location_raw
        if isinstance(location_value, str):
            location_value = _normalise_whitespace(location_value)

        status_raw = payload.get("status") or payload.get("availability")
        if isinstance(status_raw, dict):
            status_value = status_raw.get("value") or status_raw.get("translated")
        else:
            status_value = status_raw
        if isinstance(status_value, str):
            status_value = _normalise_whitespace(status_value)
        status = str(status_value) if status_value else "Unknown"

        url_raw = payload.get("url") or payload.get("holdingsUrl") or ""
        url = str(url_raw) if url_raw else ""

        # Call number from location or callnumber field
        call_number_raw = payload.get("callnumber") or payload.get("call_number")
        call_number = str(call_number_raw) if call_number_raw else None

        # Calculate available_count based on status
        status_lower = status.lower() if status else ""
        is_available = status_lower in ("available", "saatavana", "lainattavissa")
        available_count = 1 if is_available else 0

        return cls(
            library=str(library_name) if library_name else "Unknown",
            location=str(location_value) if location_value else None,
            status=status,
            url=url,
            available_count=available_count,
            total_count=1,
            call_number=call_number or (str(location_value) if location_value else None),
        )


class AvailabilityResponse(BaseModel):
    """Availability response for a book across libraries."""

    record_id: str
    items: list[AvailabilityItem]
    total_available: int = 0  # Total available copies across all libraries
    total_copies: int = 0  # Total copies across all libraries

    @classmethod
    def from_finna(
        cls, record_id: str, payload: dict[str, Any]
    ) -> "AvailabilityResponse":
        """Create an AvailabilityResponse from Finna API response."""
        records = payload.get("records")
        items: list[AvailabilityItem] = []

        if isinstance(records, dict):
            entries = records.get(record_id)
            if isinstance(entries, list):
                items_payload = [dict(item) for item in entries]
                items = [AvailabilityItem.from_finna(item) for item in items_payload]
        elif isinstance(records, list):
            items_payload = [dict(item) for item in records]
            items = [AvailabilityItem.from_finna(item) for item in items_payload]
        else:
            items = cls._parse_ajax_response(record_id, payload)

        # Calculate totals
        total_available = sum(item.available_count for item in items)
        total_copies = sum(item.total_count for item in items)

        return cls(
            record_id=record_id,
            items=items,
            total_available=total_available,
            total_copies=total_copies,
        )

    @staticmethod
    def _parse_ajax_response(
        record_id: str, payload: dict[str, Any]
    ) -> list[AvailabilityItem]:
        """Parse AJAX-style availability response."""
        data = payload.get("data")
        if not isinstance(data, dict):
            return []

        statuses = data.get("statuses")
        items: list[AvailabilityItem] = []

        for entry in _iter_status_entries(statuses):
            entry_id = entry.get("id")
            if entry_id and entry_id != record_id:
                continue
            for item_payload in _build_item_payloads(record_id, entry):
                items.append(AvailabilityItem.from_finna(item_payload))

        return items
