"""Search API routes for Finna integration."""

from __future__ import annotations

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import get_cache_backend, get_finna_service
from app.core.cache import CacheBackend
from app.core.config import Settings, get_settings
from app.schemas.availability import AvailabilityResponse
from app.schemas.search import SearchResponse, SearchResultRecord, SearchType
from app.services.finna import FinnaService

router = APIRouter(prefix="/search")

logger = logging.getLogger(__name__)

_NO_COVER_SENTINEL = "__no_cover__"
_COVER_CACHE_TTL_SECONDS = 60 * 60 * 24  # 24 hours
_SEARCH_CACHE_SCHEMA_VERSION = 2

FILTER_FIELD_MAP = {
    "author": "author_facet",
    "subject": "genre_facet",
    "format": "format",
}
FACET_FIELDS = tuple(FILTER_FIELD_MAP.values())


def _needs_cover_enrichment(record: SearchResultRecord) -> bool:
    """Check if a record needs cover image enrichment."""
    if not record.cover_url:
        return True
    default_cover = SearchResultRecord._normalize_cover_url(record.record_id, None)
    return record.cover_url.strip().lower() == (default_cover or "").strip().lower()


async def _fetch_cover_with_cache(
    record_id: str,
    cache: CacheBackend,
    settings: Settings,
    service: FinnaService,
) -> str | None:
    """Fetch cover image URL with caching."""
    cache_key = FinnaService.cache_key("cover", {"record_id": record_id})
    cached = await cache.get(cache_key)
    if cached is not None:
        if cached == _NO_COVER_SENTINEL:
            return None
        return str(cached)

    try:
        cover_url = await service.fetch_cover_image(record_id)
    except Exception as exc:
        logger.debug(
            "Failed to fetch cover image for %s: %s", record_id, exc, exc_info=True
        )
        return None

    if cover_url:
        await cache.set(cache_key, cover_url, _COVER_CACHE_TTL_SECONDS)
        return cover_url

    await cache.set(cache_key, _NO_COVER_SENTINEL, settings.cache_ttl_seconds)
    return None


async def _enhance_cover_urls(
    response: SearchResponse,
    cache: CacheBackend,
    settings: Settings,
    service: FinnaService,
) -> None:
    """Enhance search results with high-quality cover images."""
    indices: list[int] = []
    tasks: list[asyncio.Task[str | None]] = []

    for index, record in enumerate(response.records):
        if _needs_cover_enrichment(record):
            indices.append(index)
            tasks.append(
                asyncio.create_task(
                    _fetch_cover_with_cache(record.record_id, cache, settings, service)
                )
            )

    if not tasks:
        return

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for index, result in zip(indices, results, strict=False):
        if isinstance(result, Exception):
            logger.debug(
                "Cover enrichment task failed for %s: %s",
                response.records[index].record_id,
                result,
            )
            continue
        if result and isinstance(result, str):
            response.records[index].cover_url = result


@router.get("", response_model=SearchResponse)
async def search_books(
    query: str = Query(..., min_length=1, description="Search phrase"),
    search_type: SearchType = Query(SearchType.ALL_FIELDS, alias="type"),
    limit: int = Query(20, ge=1, le=50),
    author: list[str] | None = Query(None, description="Author facet filters"),
    subject: list[str] | None = Query(None, description="Subject facet filters"),
    format: list[str] | None = Query(None, description="Format facet filters"),
    cache: CacheBackend = Depends(get_cache_backend),
    settings: Settings = Depends(get_settings),
    service: FinnaService = Depends(get_finna_service),
) -> SearchResponse:
    """
    Search for books in Finnish libraries via Finna API.

    Args:
        query: Search phrase (required)
        search_type: Type of search (AllFields, Author, Subject, Title)
        limit: Maximum number of results (1-50)
        author: Filter by author
        subject: Filter by subject/genre
        format: Filter by format

    Returns:
        Search results with book records and facets
    """
    limit = min(limit, settings.default_search_limit)

    # Build cache key
    filters_payload = {
        "author": sorted(author) if author else [],
        "subject": sorted(subject) if subject else [],
        "format": sorted(format) if format else [],
    }
    payload = {
        "query": query,
        "type": search_type.value,
        "limit": limit,
        "filters": filters_payload,
        "schema_version": _SEARCH_CACHE_SCHEMA_VERSION,
    }
    cache_key = FinnaService.cache_key("search", payload)

    # Check cache
    cached = await cache.get(cache_key)
    if cached:
        return SearchResponse.model_validate_json(cached)

    # Make request to Finna
    try:
        filter_params = {
            field_name: values
            for field_name, values in (
                (FILTER_FIELD_MAP["author"], author or []),
                (FILTER_FIELD_MAP["subject"], subject or []),
                (FILTER_FIELD_MAP["format"], format or []),
            )
            if values
        }

        result = await service.search(
            query=query,
            search_type=search_type.value,
            limit=limit,
            filters=filter_params,
            facet_fields=FACET_FIELDS,
        )
    except httpx.HTTPStatusError as exc:
        # Surface the upstream status for easier debugging in production
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Finna upstream error: {exc.response.text[:200]}"
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail="Failed to execute Finna search"
        ) from exc

    response = SearchResponse.from_finna(result)

    # Enhance covers (async)
    await _enhance_cover_urls(response, cache, settings, service)

    # Cache response
    await cache.set(cache_key, response.model_dump_json(), settings.cache_ttl_seconds)

    return response


@router.get("/availability/{record_id}", response_model=AvailabilityResponse)
async def get_availability(
    record_id: str,
    latitude: float | None = Query(
        None, description="User's latitude for distance calculation"
    ),
    longitude: float | None = Query(
        None, description="User's longitude for distance calculation"
    ),
    cache: CacheBackend = Depends(get_cache_backend),
    settings: Settings = Depends(get_settings),
    service: FinnaService = Depends(get_finna_service),
) -> AvailabilityResponse:
    """
    Get availability information for a specific book.

    Args:
        record_id: Finna record ID
        latitude: Optional user latitude for distance calculation
        longitude: Optional user longitude for distance calculation

    Returns:
        Availability information across libraries
    """
    # Cache key includes location for location-aware caching
    payload = {"record_id": record_id, "lat": latitude, "lon": longitude}
    cache_key = FinnaService.cache_key("availability", payload)

    cached = await cache.get(cache_key)
    if cached:
        return AvailabilityResponse.model_validate_json(cached)

    try:
        result = await service.availability(record_id=record_id)
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail="Failed to retrieve availability"
        ) from exc

    response = AvailabilityResponse.from_finna(record_id, result)

    # Enrich with distance information if user location provided
    if latitude is not None and longitude is not None:
        try:
            from app.db import get_db, SessionLocal
            from app.models.library import Library
            from app.services import library_service
            from sqlalchemy import or_, select

            # Get database session
            db = SessionLocal()

            try:
                # Calculate distances for each availability item
                for item in response.items:
                    # Extract library name (remove loan period info)
                    library_name = item.library.split(",")[0].strip()
                    name_parts = library_name.split()
                    search_term = name_parts[0] if name_parts else library_name

                    # Search for matching library in database
                    search_pattern = f"%{search_term}%"
                    query = select(Library).filter(
                        Library.is_active == True,
                        or_(
                            Library.name.ilike(search_pattern),
                            Library.city.ilike(search_pattern),
                            Library.address.ilike(search_pattern),
                        ),
                    )
                    library = db.execute(query).scalars().first()

                    if library and library.latitude and library.longitude:
                        distance_km = library_service.haversine_distance(
                            latitude, longitude, library.latitude, library.longitude
                        )
                        item.distance_km = round(distance_km, 3)
                
                # Sort by distance
                response.items.sort(
                    key=lambda x: (
                        x.distance_km is None,
                        x.distance_km if x.distance_km is not None else float("inf"),
                    )
                )
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error enriching distances: {e}", exc_info=True)

    await cache.set(cache_key, response.model_dump_json(), settings.cache_ttl_seconds)
    return response
