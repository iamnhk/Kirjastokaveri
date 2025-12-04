"""Pydantic schemas for reading list operations."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ReadingItemBase(BaseModel):
    """Base reading item schema."""

    finna_id: Optional[str] = Field(None, max_length=255)
    title: str = Field(..., max_length=500)
    author: Optional[str] = Field(None, max_length=300)
    cover_image: Optional[str] = None
    progress: int = Field(default=0, ge=0, le=100)
    library_id: Optional[str] = Field(None, max_length=100)
    library_name: Optional[str] = Field(None, max_length=200)
    due_date: Optional[str] = Field(None, max_length=30)
    start_date: Optional[str] = Field(None, max_length=30)
    user_notes: Optional[str] = None


class ReadingItemCreate(ReadingItemBase):
    """Schema for creating a reading item."""

    pass


class ReadingItemUpdate(BaseModel):
    """Schema for updating a reading item (all fields optional)."""

    progress: Optional[int] = Field(None, ge=0, le=100)
    due_date: Optional[str] = Field(None, max_length=30)
    user_notes: Optional[str] = None


class ReadingItemResponse(ReadingItemBase):
    """Schema for reading item response."""

    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
