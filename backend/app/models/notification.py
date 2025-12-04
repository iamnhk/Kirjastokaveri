"""Notification model for tracking sent notifications."""

import enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(str, enum.Enum):
    """Notification type enumeration."""

    BOOK_AVAILABLE = "book_available"
    RESERVATION_CONFIRMED = "reservation_confirmed"
    READY_FOR_PICKUP = "ready_for_pickup"
    PICKUP_DEADLINE_APPROACHING = "pickup_deadline_approaching"
    RESERVATION_CANCELLED = "reservation_cancelled"
    BOOK_PICKED_UP = "book_picked_up"
    DUE_DATE_REMINDER = "due_date_reminder"
    OVERDUE = "overdue"


class Notification(Base, TimestampMixin):
    """User notification model."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # Notification details
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Related book/reservation information
    book_title: Mapped[Optional[str]] = mapped_column(String(500))
    library_name: Mapped[Optional[str]] = mapped_column(String(200))
    finna_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    reservation_id: Mapped[Optional[int]] = mapped_column(Integer)

    # Notification status
    sent_at: Mapped[str] = mapped_column(String(30), nullable=False)  # ISO datetime
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    action_taken: Mapped[Optional[str]] = mapped_column(String(100))

    # Delivery tracking
    delivery_method: Mapped[str] = mapped_column(
        String(50), default="browser", nullable=False
    )  # browser, email, push
    delivery_status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False
    )  # pending, sent, failed

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type='{self.notification_type.value}', title='{self.title}')>"
