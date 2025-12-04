"""Pydantic schemas for completed books operations."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CompletedItemBase(BaseModel):
    """Base completed item schema."""

    finna_id: Optional[str] = Field(None, max_length=255)
    title: str = Field(..., max_length=500)
    author: Optional[str] = Field(None, max_length=300)
    cover_image: Optional[str] = None
    completed_date: str = Field(..., max_length=30)
    rating: Optional[int] = Field(None, ge=1, le=5)
    start_date: Optional[str] = Field(None, max_length=30)
    user_notes: Optional[str] = None
    review: Optional[str] = None


class CompletedItemCreate(CompletedItemBase):
    """Schema for creating a completed item."""

    pass


class CompletedItemUpdate(BaseModel):
    """Schema for updating a completed item (all fields optional)."""

    rating: Optional[int] = Field(None, ge=1, le=5)
    user_notes: Optional[str] = None
    review: Optional[str] = None


class CompletedItemResponse(CompletedItemBase):
    """Schema for completed item response."""

    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
