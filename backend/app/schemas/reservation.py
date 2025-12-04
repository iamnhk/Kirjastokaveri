"""Pydantic schemas for reservation operations."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.reservation import ReservationStatus


class ReservationBase(BaseModel):
    """Base reservation schema."""

    finna_id: str = Field(..., max_length=255)
    title: str = Field(..., max_length=500)
    author: Optional[str] = Field(None, max_length=300)
    cover_image: Optional[str] = None
    library_id: str = Field(..., max_length=100)
    library_name: str = Field(..., max_length=200)
    user_notes: Optional[str] = None


class ReservationCreate(ReservationBase):
    """Schema for creating a reservation."""

    reservation_date: Optional[str] = None
    pickup_deadline: Optional[str] = None
    due_date: Optional[str] = None
    queue_position: Optional[int] = None
    estimated_wait_days: Optional[int] = None


class ReservationUpdate(BaseModel):
    """Schema for updating a reservation (all fields optional)."""

    status: Optional[ReservationStatus] = None
    pickup_date: Optional[str] = None
    pickup_deadline: Optional[str] = None
    due_date: Optional[str] = None
    return_date: Optional[str] = None
    reservation_number: Optional[str] = None
    user_notes: Optional[str] = None
    queue_position: Optional[int] = None
    estimated_wait_days: Optional[int] = None


class ReservationResponse(ReservationBase):
    """Schema for reservation response."""

    id: int
    user_id: int
    status: ReservationStatus
    reservation_date: Optional[str]
    pickup_date: Optional[str]
    pickup_deadline: Optional[str]
    due_date: Optional[str]
    return_date: Optional[str]
    reservation_number: Optional[str]
    queue_position: Optional[int]
    estimated_wait_days: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
