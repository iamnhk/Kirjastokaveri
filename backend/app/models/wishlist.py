"""Wishlist model for saved books."""

from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class WishlistItem(Base, TimestampMixin):
    """User wishlist item model."""

    __tablename__ = "wishlist_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # Finna book identifiers
    finna_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Book metadata (cached from Finna)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(300))
    year: Mapped[Optional[str]] = mapped_column(String(20))
    isbn: Mapped[Optional[str]] = mapped_column(String(100))
    cover_image: Mapped[Optional[str]] = mapped_column(Text)

    # Availability notification settings
    notify_on_available: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    preferred_library_id: Mapped[Optional[str]] = mapped_column(String(100))
    preferred_library_name: Mapped[Optional[str]] = mapped_column(String(200))

    # Last check information
    last_availability_check: Mapped[Optional[str]] = mapped_column(
        String(30)
    )  # ISO datetime
    is_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    availability_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON)

    # Notes
    user_notes: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="wishlist_items")

    def __repr__(self) -> str:
        return f"<WishlistItem(id={self.id}, user_id={self.user_id}, title='{self.title}')>"
