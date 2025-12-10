"""Libraries API routes."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.library import Library
from app.schemas.library import LibraryResponse
from app.services import library_service

router = APIRouter(prefix="/libraries")

logger = logging.getLogger(__name__)


def _library_to_response(lib: Library, distance_km: float | None = None) -> LibraryResponse:
    """Convert a Library model to a LibraryResponse schema."""
    return LibraryResponse(
        id=lib.id,
        name=lib.name,
        city=lib.city,
        address=lib.address,
        latitude=lib.latitude,
        longitude=lib.longitude,
        library_system=lib.library_system,
        is_active=lib.is_active,
        external_id=lib.external_id,
        email=lib.email,
        homepage=lib.homepage,
        phone=lib.phone,
        distance_km=distance_km,
    )


@router.get("", response_model=list[LibraryResponse])
async def get_libraries(
    latitude: float | None = Query(None, description="User's latitude for proximity search"),
    longitude: float | None = Query(None, description="User's longitude for proximity search"),
    max_distance_km: float = Query(50.0, ge=0.1, le=500, description="Maximum distance in km"),
    city: str | None = Query(None, description="Filter by city name"),
    limit: int = Query(20, ge=1, le=100, description="Maximum libraries to return"),
    db: Session = Depends(get_db),
) -> list[LibraryResponse]:
    """
    Get libraries, optionally filtered by location or city.

    Args:
        latitude: User's latitude for proximity search
        longitude: User's longitude for proximity search
        max_distance_km: Maximum distance in km (default: 50)
        city: Filter by city name
        limit: Maximum libraries to return

    Returns:
        List of libraries with optional distance information
    """
    query = select(Library).filter(Library.is_active == True)

    if city:
        query = query.filter(Library.city.ilike(f"%{city}%"))

    libraries = db.execute(query).scalars().all()

    # Calculate distances if user location provided
    if latitude is not None and longitude is not None:
        libraries_with_distance: list[tuple[Library, float | None]] = []

        for library in libraries:
            if library.latitude and library.longitude:
                distance = library_service.haversine_distance(
                    latitude, longitude, library.latitude, library.longitude
                )
                if distance <= max_distance_km:
                    libraries_with_distance.append((library, distance))
            else:
                # Include libraries without coordinates (distance = None)
                libraries_with_distance.append((library, None))

        # Sort by distance (None values last)
        libraries_with_distance.sort(
            key=lambda x: (x[1] is None, x[1] if x[1] is not None else float("inf"))
        )

        # Apply limit
        libraries_with_distance = libraries_with_distance[:limit]

        # Build response with distances
        return [
            _library_to_response(lib, round(dist, 3) if dist is not None else None)
            for lib, dist in libraries_with_distance
        ]
    else:
        # No location provided - just return libraries ordered by name
        libraries = list(libraries)[:limit]
        return [
            _library_to_response(lib)
            for lib in sorted(libraries, key=lambda x: x.name)
        ]


@router.get("/{library_id}", response_model=LibraryResponse)
async def get_library(
    library_id: int,
    latitude: float | None = Query(None, description="User's latitude for distance calculation"),
    longitude: float | None = Query(None, description="User's longitude for distance calculation"),
    db: Session = Depends(get_db),
) -> LibraryResponse:
    """
    Get a specific library by ID.

    Args:
        library_id: Library ID
        latitude: Optional user latitude for distance calculation
        longitude: Optional user longitude for distance calculation

    Returns:
        Library details
    """
    library = db.execute(
        select(Library).filter(Library.id == library_id)
    ).scalar_one_or_none()

    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library not found",
        )

    distance = None
    if (
        latitude is not None
        and longitude is not None
        and library.latitude is not None
        and library.longitude is not None
    ):
        distance = library_service.haversine_distance(
            latitude, longitude, library.latitude, library.longitude
        )
        distance = round(distance, 3)

    return _library_to_response(library, distance)


@router.get("/stats", response_model=dict)
async def get_library_stats(
    db: Session = Depends(get_db),
) -> dict:
    """
    Get statistics about libraries in the database.
    Useful for diagnosing geocoding coverage.
    """
    total = db.execute(select(Library).filter(Library.is_active == True)).scalars().all()
    with_coords = [l for l in total if l.latitude and l.longitude]
    without_coords = [l for l in total if not l.latitude or not l.longitude]
    
    return {
        "total_libraries": len(total),
        "with_coordinates": len(with_coords),
        "without_coordinates": len(without_coords),
        "geocoding_coverage_percent": round(len(with_coords) / len(total) * 100, 1) if total else 0,
        "sample_without_coords": [
            {"name": l.name, "city": l.city, "address": l.address}
            for l in without_coords[:10]
        ] if without_coords else [],
    }


@router.get("/nearby/search", response_model=list[LibraryResponse])
async def search_nearby_libraries(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius_km: float = Query(10.0, ge=0.5, le=100, description="Search radius in km"),
    limit: int = Query(10, ge=1, le=50, description="Maximum libraries to return"),
    db: Session = Depends(get_db),
) -> list[LibraryResponse]:
    """
    Search for libraries near a specific location.

    Args:
        latitude: User's latitude (required)
        longitude: User's longitude (required)
        radius_km: Search radius in kilometers
        limit: Maximum libraries to return

    Returns:
        List of nearby libraries sorted by distance
    """
    libraries = db.execute(
        select(Library).filter(
            Library.is_active == True,
            Library.latitude.isnot(None),
            Library.longitude.isnot(None),
        )
    ).scalars().all()

    nearby: list[tuple[Library, float]] = []

    for library in libraries:
        if library.latitude and library.longitude:
            distance = library_service.haversine_distance(
                latitude, longitude, library.latitude, library.longitude
            )
            if distance <= radius_km:
                nearby.append((library, distance))

    # Sort by distance
    nearby.sort(key=lambda x: x[1])

    # Apply limit
    nearby = nearby[:limit]

    return [
        _library_to_response(lib, round(dist, 3))
        for lib, dist in nearby
    ]
