"""Pydantic schemas for library operations."""

from typing import Optional

from pydantic import BaseModel


class LibraryResponse(BaseModel):
    """Schema for library response."""

    id: int
    name: str
    city: Optional[str]
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    library_system: Optional[str]
    is_active: bool
    external_id: Optional[str]
    email: Optional[str]
    homepage: Optional[str]
    phone: Optional[str]
    distance_km: Optional[float] = None  # Calculated distance from user

    model_config = {"from_attributes": True}
