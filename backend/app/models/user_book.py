"""Unified UserBook model for all book lists (wishlist, reading, completed, reserved)."""

import enum
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import JSON, Boolean, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class ListType(str, enum.Enum):
    """Book list type enumeration."""

    WISHLIST = "wishlist"
    READING = "reading"
    COMPLETED = "completed"
    RESERVED = "reserved"


class ReservationStatus(str, enum.Enum):
    """Reservation status enumeration (used when list_type is RESERVED)."""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    READY_FOR_PICKUP = "ready_for_pickup"
    PICKED_UP = "picked_up"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class UserBook(Base, TimestampMixin):
    """
    Unified model for tracking user's books across all lists.
    
    Replaces: WishlistItem, ReadingItem, CompletedItem, Reservation
    """

    __tablename__ = "user_books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # List type - determines which "list" this book belongs to
    # Use native_enum=True and create_type=False to match existing PostgreSQL enum 'listtype'
    list_type: Mapped[ListType] = mapped_column(
        Enum(
            ListType,
            name='listtype',
            native_enum=True,
            create_type=False,
            values_callable=lambda x: [e.value for e in x]
        ),
        nullable=False, index=True
    )

    # === Core Book Information (all lists) ===
    finna_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(300))
    cover_image: Mapped[Optional[str]] = mapped_column(Text)
    
    # Additional book metadata (from Finna)
    year: Mapped[Optional[str]] = mapped_column(String(20))
    isbn: Mapped[Optional[str]] = mapped_column(String(100))

    # === Library Information (reading, reserved, wishlist preference) ===
    library_id: Mapped[Optional[str]] = mapped_column(String(100))
    library_name: Mapped[Optional[str]] = mapped_column(String(200))

    # === Dates ===
    start_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime - when started reading
    due_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime - loan due date
    completed_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime - when finished
    reservation_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    pickup_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    pickup_deadline: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    return_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime

    # === Reading Progress (list_type=reading) ===
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0-100%

    # === Rating & Review (list_type=completed) ===
    rating: Mapped[Optional[int]] = mapped_column(Integer)  # 1-5 stars
    review: Mapped[Optional[str]] = mapped_column(Text)

    # === Reservation Status (list_type=reserved) ===
    # Use native_enum=True and create_type=False to match existing PostgreSQL enum 'reservationstatus'
    status: Mapped[Optional[ReservationStatus]] = mapped_column(
        Enum(
            ReservationStatus,
            name='reservationstatus',
            native_enum=True,
            create_type=False,
            values_callable=lambda x: [e.value for e in x]
        )
    )
    queue_position: Mapped[Optional[int]] = mapped_column(Integer)
    estimated_wait_days: Mapped[Optional[int]] = mapped_column(Integer)
    reservation_number: Mapped[Optional[str]] = mapped_column(String(100))

    # === Wishlist Notifications (list_type=wishlist) ===
    notify_on_available: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    last_availability_check: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    is_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    availability_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON)
    
    # === Tracked Libraries (list_type=wishlist) ===
    # Array of library names to monitor for availability
    tracked_libraries: Mapped[Optional[list[str]]] = mapped_column(JSON)

    # === User Notes (all lists) ===
    user_notes: Mapped[Optional[str]] = mapped_column(Text)

    # === Relationships ===
    user: Mapped["User"] = relationship("User", back_populates="books")

    # === Indexes for common queries ===
    __table_args__ = (
        Index("idx_user_books_user_list", "user_id", "list_type"),
        Index("idx_user_books_user_finna", "user_id", "finna_id"),
        Index("idx_user_books_notify", "user_id", "notify_on_available", 
              postgresql_where="notify_on_available = true"),
    )

    def __repr__(self) -> str:
        return f"<UserBook(id={self.id}, user_id={self.user_id}, list='{self.list_type.value}', title='{self.title}')>"
