"""User model for authentication."""

from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.completed import CompletedItem
    from app.models.notification import Notification
    from app.models.reading import ReadingItem
    from app.models.reservation import Reservation
    from app.models.user_book import UserBook
    from app.models.wishlist import WishlistItem


class User(Base, TimestampMixin):
    """User account model."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    username: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # New unified books relationship
    books: Mapped[list["UserBook"]] = relationship(
        "UserBook", back_populates="user", cascade="all, delete-orphan"
    )

    # Legacy relationships (kept for migration, will be removed later)
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(
        "WishlistItem", back_populates="user", cascade="all, delete-orphan"
    )
    reservations: Mapped[list["Reservation"]] = relationship(
        "Reservation", back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    reading_items: Mapped[list["ReadingItem"]] = relationship(
        "ReadingItem", back_populates="user", cascade="all, delete-orphan"
    )
    completed_items: Mapped[list["CompletedItem"]] = relationship(
        "CompletedItem", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', username='{self.username}')>"
