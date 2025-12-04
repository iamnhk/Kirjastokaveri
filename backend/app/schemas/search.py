"""Pydantic schemas for search operations."""

from __future__ import annotations

from enum import Enum
from typing import Any, Iterable

from pydantic import BaseModel, Field


class SearchType(str, Enum):
    """Search type enumeration."""

    ALL_FIELDS = "AllFields"
    AUTHOR = "Author"
    SUBJECT = "Subject"
    TITLE = "Title"


class SearchResultRecord(BaseModel):
    """Individual search result record."""

    record_id: str
    title: str | None = None
    authors: list[str] = Field(default_factory=list)
    year: str | None = None
    cover_url: str | None = None
    buildings: list[str] = Field(default_factory=list)
    isbns: list[str] = Field(default_factory=list)

    @staticmethod
    def _normalize_cover_url(record_id: str, url: str | None) -> str | None:
        if url is None or not url.strip():
            return f"https://www.finna.fi/Cover/Show?id={record_id}&index=0&size=medium"

        cleaned = url.strip()
        if cleaned.startswith("http://") or cleaned.startswith("https://"):
            return cleaned
        if cleaned.startswith("//"):
            return f"https:{cleaned}"
        if cleaned.startswith("/"):
            return f"https://www.finna.fi{cleaned}"
        return f"https://www.finna.fi/{cleaned}"

    @classmethod
    def from_finna(cls, payload: dict[str, Any]) -> "SearchResultRecord":
        """Create a SearchResultRecord from Finna API response."""
        authors_raw: Iterable[Any] = payload.get("nonPresenterAuthors") or []
        authors: list[str] = []
        for author in authors_raw:
            if isinstance(author, dict):
                name = author.get("name") or author.get("value")
                if name:
                    authors.append(str(name))
            elif author:
                authors.append(str(author))

        record_id = str(payload.get("id", ""))
        images = payload.get("images") or []
        cover_url = None
        if images:
            first_image = images[0]
            if isinstance(first_image, dict):
                cover_url = first_image.get("master") or first_image.get("small")
            else:
                cover_url = str(first_image)

        raw_isbns = payload.get("isbns") or []
        normalized_isbns: list[str] = []
        for entry in raw_isbns:
            if isinstance(entry, dict):
                value = entry.get("value")
                if value:
                    normalized_isbns.append(str(value))
            elif entry:
                normalized_isbns.append(str(entry))

        normalized_cover_url = cls._normalize_cover_url(record_id, cover_url)

        # Extract building names - Finna returns buildings as dicts with 'value' and 'translated' keys
        raw_buildings = payload.get("buildings", [])
        buildings: list[str] = []
        for building in raw_buildings:
            if isinstance(building, dict):
                # Prefer translated name, fall back to value
                name = building.get("translated") or building.get("value")
                if name:
                    buildings.append(str(name))
            elif building:
                buildings.append(str(building))

        return cls(
            record_id=record_id,
            title=payload.get("title"),
            authors=authors,
            year=str(payload.get("year")) if payload.get("year") else None,
            cover_url=normalized_cover_url,
            buildings=buildings,
            isbns=normalized_isbns,
        )


class FacetBucket(BaseModel):
    """Facet bucket for filtering."""

    value: str
    count: int


class SearchResponse(BaseModel):
    """Search response containing results and facets."""

    total_hits: int
    records: list[SearchResultRecord]
    facets: dict[str, list[FacetBucket]] = Field(default_factory=dict)

    @classmethod
    def from_finna(cls, payload: dict[str, Any]) -> "SearchResponse":
        """Create a SearchResponse from Finna API response."""
        records_payload = payload.get("records", [])
        records = [SearchResultRecord.from_finna(item) for item in records_payload]

        facets_payload = payload.get("facets") or {}
        facets: dict[str, list[FacetBucket]] = {}

        for field, buckets in facets_payload.items():
            parsed_buckets: list[FacetBucket] = []
            for bucket in buckets or []:
                if isinstance(bucket, (list, tuple)) and len(bucket) >= 2:
                    value, count = bucket[0], bucket[1]
                    parsed_buckets.append(
                        FacetBucket(value=str(value), count=int(count)),
                    )
                    continue

                if isinstance(bucket, dict):
                    raw_value = bucket.get("value") or bucket.get("translated")
                    raw_count = bucket.get("count") or bucket.get("total")
                    if raw_value is None or raw_count is None:
                        continue
                    try:
                        count_int = int(raw_count)
                    except (TypeError, ValueError):
                        continue
                    parsed_buckets.append(
                        FacetBucket(value=str(raw_value), count=count_int),
                    )

            if parsed_buckets:
                facets[str(field)] = parsed_buckets

        total_hits = payload.get("totalHits") or payload.get("resultCount", 0)
        return cls(total_hits=int(total_hits), records=records, facets=facets)
