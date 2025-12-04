"""Reading list model for tracking currently reading books."""

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class ReadingItem(Base, TimestampMixin):
    """Currently reading book tracking model."""

    __tablename__ = "reading_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    # Book information (can be from Finna or manually added)
    finna_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(300))
    cover_image: Mapped[Optional[str]] = mapped_column(Text)

    # Reading progress
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0-100%
    
    # Library loan information
    library_id: Mapped[Optional[str]] = mapped_column(String(100))
    library_name: Mapped[Optional[str]] = mapped_column(String(200))
    due_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    
    # Additional tracking
    start_date: Mapped[Optional[str]] = mapped_column(String(30))  # ISO datetime
    user_notes: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="reading_items")

    def __repr__(self) -> str:
        return f"<ReadingItem(id={self.id}, user_id={self.user_id}, title='{self.title}', progress={self.progress}%)>"
