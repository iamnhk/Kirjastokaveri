"""Finna API service for searching and retrieving book information."""

from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.core.config import Settings

_SEARCH_TYPE_MAP = {
    "AllFields": "AllFields",
    "Author": "Author",
    "Subject": "Subject",
    "Title": "Title",
}


class FinnaService:
    """Service for interacting with the Finna API."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._base_url = settings.finna_base_url.rstrip("/")
        self._availability_base_url = settings.finna_availability_base_url.rstrip("/")
        self._availability_endpoint = settings.finna_availability_endpoint

    async def _request(self, endpoint: str, params: dict[str, Any]) -> Any:
        """Make an async HTTP request to the Finna API."""
        url = f"{self._base_url}{endpoint}"
        headers = {
            "User-Agent": "Kirjastokaveri/1.0 (+https://kirjastokaveri-frontend.onrender.com)",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(
            timeout=self._settings.request_timeout_seconds,
            headers=headers,
        ) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()

    async def search(
        self,
        query: str,
        search_type: str,
        limit: int,
        *,
        filters: Mapping[str, Sequence[str]] | None = None,
        facet_fields: Sequence[str] | None = None,
    ) -> dict[str, Any]:
        """
        Search for books in Finna.

        Args:
            query: Search query string
            search_type: Type of search (AllFields, Author, Subject, Title)
            limit: Maximum number of results
            filters: Optional facet filters
            facet_fields: Fields to return facets for

        Returns:
            Finna API search response
        """
        mapped_type = _SEARCH_TYPE_MAP.get(search_type, "AllFields")
        params: dict[str, Any] = {
            "lookfor": query,
            "type": mapped_type,
            "limit": limit,
            "field[]": [
                "id",
                "title",
                "nonPresenterAuthors",
                "year",
                "images",
                "buildings",
                "isbns",
                "formats",
            ],
        }

        if filters:
            filter_values: list[str] = []
            for field, values in filters.items():
                for value in values:
                    cleaned = str(value).strip()
                    if not cleaned:
                        continue
                    escaped = cleaned.replace('"', '\\"')
                    filter_values.append(f'{field}:"{escaped}"')
            if filter_values:
                params["filter[]"] = filter_values

        if facet_fields:
            facet_list = [field for field in facet_fields if field]
            if facet_list:
                params["facet[]"] = facet_list
                params["facetLimit"] = 25

        return await self._request(self._settings.finna_search_endpoint, params)

    async def availability(self, record_id: str) -> dict[str, Any]:
        """
        Get availability information for a book.

        Args:
            record_id: Finna record ID

        Returns:
            Availability data from Finna
        """
        params = {"method": "getItemStatuses", "id[]": record_id}
        url = f"{self._availability_base_url}{self._availability_endpoint}"
        headers = {
            "User-Agent": "Kirjastokaveri/1.0",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{self._availability_base_url}/Record/{record_id}",
        }
        async with httpx.AsyncClient(
            timeout=self._settings.request_timeout_seconds
        ) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            return response.json()

    async def fetch_cover_image(self, record_id: str) -> str | None:
        """
        Fetch cover image URL from Finna by scraping the record page.

        Args:
            record_id: Finna record ID

        Returns:
            Cover image URL or None if not found
        """
        page_url = f"{self._availability_base_url}/Record/{record_id}"
        headers = {
            "User-Agent": "Kirjastokaveri/1.0",
            "Accept": "text/html",
        }
        async with httpx.AsyncClient(
            timeout=self._settings.request_timeout_seconds
        ) as client:
            response = await client.get(page_url, headers=headers)
            response.raise_for_status()
            html = response.text

        soup = BeautifulSoup(html, "html.parser")
        meta = soup.find("meta", attrs={"property": "og:image"})
        if not meta:
            return None

        cover_url = (meta.get("content") or "").strip()
        if not cover_url:
            return None

        if cover_url.startswith("//"):
            cover_url = f"https:{cover_url}"
        elif cover_url.startswith("/"):
            cover_url = f"{self._availability_base_url}{cover_url}"

        if "size=small" in cover_url or "size=medium" in cover_url:
            cover_url = cover_url.replace("size=small", "size=large").replace(
                "size=medium", "size=large"
            )

        return cover_url

    @staticmethod
    def cache_key(prefix: str, payload: dict[str, Any]) -> str:
        """Generate a cache key from prefix and payload."""
        serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return f"finna:{prefix}:{serialized}"
