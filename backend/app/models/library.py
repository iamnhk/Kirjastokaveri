"""Library location models for geographic features."""

from typing import Optional

from sqlalchemy import Boolean, Float, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Library(Base, TimestampMixin):
    """Library location with geocoded coordinates."""

    __tablename__ = "libraries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    city: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    address: Mapped[Optional[str]] = mapped_column(String(500))
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)

    # Library metadata
    library_system: Mapped[Optional[str]] = mapped_column(
        String(100), index=True
    )  # e.g., "Helmet", "Oodi"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # External references
    external_id: Mapped[Optional[str]] = mapped_column(
        String(50), unique=True, index=True
    )  # Kirjastot.fi ID
    email: Mapped[Optional[str]] = mapped_column(String(255))
    homepage: Mapped[Optional[str]] = mapped_column(String(500))
    phone: Mapped[Optional[str]] = mapped_column(String(50))

    # Indexes for geographic queries
    __table_args__ = (
        Index("idx_library_coordinates", "latitude", "longitude"),
        Index("idx_library_city_active", "city", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Library(name='{self.name}', city='{self.city}')>"
