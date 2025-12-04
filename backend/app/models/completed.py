"""Completed books model for tracking finished reading."""

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class CompletedItem(Base, TimestampMixin):
    """Completed book tracking model."""

    __tablename__ = "completed_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # Book information (can be from Finna or manually added)
    finna_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(300))
    cover_image: Mapped[Optional[str]] = mapped_column(Text)

    # Completion information
    completed_date: Mapped[str] = mapped_column(String(30), nullable=False)  # ISO date
    rating: Mapped[Optional[int]] = mapped_column(Integer)  # 1-5 stars
    
    # Reading stats
    start_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    
    # User review/notes
    user_notes: Mapped[Optional[str]] = mapped_column(Text)
    review: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="completed_items")

    def __repr__(self) -> str:
        return f"<CompletedItem(id={self.id}, user_id={self.user_id}, title='{self.title}', rating={self.rating})>"
