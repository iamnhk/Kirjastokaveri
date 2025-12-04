"""Pydantic schemas for notification operations."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    """Schema for notification response."""

    id: int
    user_id: int
    notification_type: NotificationType
    title: str
    message: str
    book_title: Optional[str] = None
    library_name: Optional[str] = None
    finna_id: Optional[str] = None
    reservation_id: Optional[int] = None
    sent_at: datetime
    read: bool
    read_at: Optional[datetime] = None
    action_taken: Optional[str] = None
    delivery_method: str
    delivery_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class NotificationUpdate(BaseModel):
    """Schema for updating a notification."""

    read: Optional[bool] = None
    read_at: Optional[str] = None
    action_taken: Optional[str] = None


class NotificationMarkRead(BaseModel):
    """Schema for marking a notification as read."""

    read: bool = True
