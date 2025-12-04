"""Pydantic schemas for wishlist operations."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WishlistItemBase(BaseModel):
    """Base wishlist item schema."""

    finna_id: str = Field(..., max_length=255)
    title: str = Field(..., max_length=500)
    author: Optional[str] = Field(None, max_length=300)
    year: Optional[str] = Field(None, max_length=20)
    isbn: Optional[str] = Field(None, max_length=100)
    cover_image: Optional[str] = None
    notify_on_available: bool = False
    preferred_library_id: Optional[str] = Field(None, max_length=100)
    preferred_library_name: Optional[str] = Field(None, max_length=200)
    user_notes: Optional[str] = None


class WishlistItemCreate(WishlistItemBase):
    """Schema for creating a wishlist item."""

    pass


class WishlistItemUpdate(BaseModel):
    """Schema for updating a wishlist item (all fields optional)."""

    notify_on_available: Optional[bool] = None
    preferred_library_id: Optional[str] = Field(None, max_length=100)
    preferred_library_name: Optional[str] = Field(None, max_length=200)
    user_notes: Optional[str] = None
    last_availability_check: Optional[str] = Field(None, max_length=30)
    is_available: Optional[bool] = None


class WishlistItemResponse(WishlistItemBase):
    """Schema for wishlist item response."""

    id: int
    user_id: int
    last_availability_check: Optional[str] = None
    is_available: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
