"""Reservation model for tracking book reservations."""

import enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class ReservationStatus(str, enum.Enum):
    """Reservation status enumeration."""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    READY_FOR_PICKUP = "ready_for_pickup"
    PICKED_UP = "picked_up"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class Reservation(Base, TimestampMixin):
    """Book reservation tracking model."""

    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # Book information
    finna_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(300))
    cover_image: Mapped[Optional[str]] = mapped_column(Text)

    # Library information
    library_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    library_name: Mapped[str] = mapped_column(String(200), nullable=False)

    # Reservation status and dates
    status: Mapped[ReservationStatus] = mapped_column(
        Enum(ReservationStatus),
        default=ReservationStatus.PENDING,
        nullable=False,
        index=True,
    )
    reservation_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    pickup_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    pickup_deadline: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    due_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    return_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime

    # Queue tracking
    queue_position: Mapped[Optional[int]] = mapped_column(Integer)
    estimated_wait_days: Mapped[Optional[int]] = mapped_column(Integer)

    # Additional tracking
    reservation_number: Mapped[Optional[str]] = mapped_column(String(100))
    user_notes: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reservations")

    def __repr__(self) -> str:
        return f"<Reservation(id={self.id}, user_id={self.user_id}, title='{self.title}', status='{self.status.value}')>"
