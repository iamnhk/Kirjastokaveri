"""Unified Pydantic schemas for UserBook model."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.user_book import ListType, ReservationStatus


class UserBookBase(BaseModel):
    """Base schema with common fields."""

    finna_id: str = Field(..., description="Finna record ID")
    title: str = Field(..., max_length=500)
    author: Optional[str] = Field(None, max_length=300)
    cover_image: Optional[str] = None
    year: Optional[str] = Field(None, max_length=20)
    isbn: Optional[str] = Field(None, max_length=100)
    user_notes: Optional[str] = None


class UserBookCreate(UserBookBase):
    """Schema for creating a new book entry."""

    list_type: ListType = Field(..., description="Which list to add the book to")

    # Library info
    library_id: Optional[str] = Field(None, max_length=100)
    library_name: Optional[str] = Field(None, max_length=200)

    # Dates
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    reservation_date: Optional[str] = None
    pickup_deadline: Optional[str] = None

    # Reading progress
    progress: int = Field(default=0, ge=0, le=100)

    # Rating (completed)
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = None

    # Reservation
    status: Optional[ReservationStatus] = None
    queue_position: Optional[int] = Field(None, ge=0)
    estimated_wait_days: Optional[int] = Field(None, ge=0)

    # Wishlist notifications
    notify_on_available: bool = False
    
    # Tracked libraries (for availability monitoring)
    tracked_libraries: Optional[list[str]] = None


class UserBookUpdate(BaseModel):
    """Schema for updating a book entry. All fields optional."""

    # Can change list type (move book between lists)
    list_type: Optional[ListType] = None

    # Book metadata (usually not updated, but allowed)
    title: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = Field(None, max_length=300)
    cover_image: Optional[str] = None

    # Library info
    library_id: Optional[str] = Field(None, max_length=100)
    library_name: Optional[str] = Field(None, max_length=200)

    # Dates
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    reservation_date: Optional[str] = None
    pickup_date: Optional[str] = None
    pickup_deadline: Optional[str] = None
    return_date: Optional[str] = None

    # Reading progress
    progress: Optional[int] = Field(None, ge=0, le=100)

    # Rating (completed)
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = None

    # Reservation
    status: Optional[ReservationStatus] = None
    queue_position: Optional[int] = Field(None, ge=0)
    estimated_wait_days: Optional[int] = Field(None, ge=0)
    reservation_number: Optional[str] = None

    # Wishlist notifications
    notify_on_available: Optional[bool] = None
    
    # Tracked libraries (for availability monitoring)
    tracked_libraries: Optional[list[str]] = None

    # Notes
    user_notes: Optional[str] = None


class UserBookResponse(UserBookBase):
    """Schema for book response with all fields."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    list_type: ListType

    # Library info
    library_id: Optional[str] = None
    library_name: Optional[str] = None

    # Dates
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    reservation_date: Optional[str] = None
    pickup_date: Optional[str] = None
    pickup_deadline: Optional[str] = None
    return_date: Optional[str] = None

    # Reading progress
    progress: int = 0

    # Rating (completed)
    rating: Optional[int] = None
    review: Optional[str] = None

    # Reservation
    status: Optional[ReservationStatus] = None
    queue_position: Optional[int] = None
    estimated_wait_days: Optional[int] = None
    reservation_number: Optional[str] = None

    # Wishlist notifications
    notify_on_available: bool = False
    last_availability_check: Optional[str] = None
    is_available: bool = False
    availability_data: Optional[dict[str, Any]] = None
    
    # Tracked libraries
    tracked_libraries: Optional[list[str]] = None

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None


# === Convenience schemas for specific list types ===

class WishlistItemCreate(BaseModel):
    """Convenience schema for adding to wishlist."""

    finna_id: str
    title: str
    author: Optional[str] = None
    cover_image: Optional[str] = None
    year: Optional[str] = None
    isbn: Optional[str] = None
    notify_on_available: bool = True
    preferred_library_id: Optional[str] = None
    preferred_library_name: Optional[str] = None
    tracked_libraries: Optional[list[str]] = None
    user_notes: Optional[str] = None

    def to_user_book_create(self) -> UserBookCreate:
        """Convert to unified UserBookCreate."""
        return UserBookCreate(
            list_type=ListType.WISHLIST,
            finna_id=self.finna_id,
            title=self.title,
            author=self.author,
            cover_image=self.cover_image,
            year=self.year,
            isbn=self.isbn,
            notify_on_available=self.notify_on_available,
            library_id=self.preferred_library_id,
            library_name=self.preferred_library_name,
            tracked_libraries=self.tracked_libraries,
            user_notes=self.user_notes,
        )


class ReadingItemCreate(BaseModel):
    """Convenience schema for adding to reading list."""

    finna_id: Optional[str] = None
    title: str
    author: Optional[str] = None
    cover_image: Optional[str] = None
    progress: int = 0
    due_date: Optional[str] = None
    start_date: Optional[str] = None
    library_id: Optional[str] = None
    library_name: Optional[str] = None
    user_notes: Optional[str] = None

    def to_user_book_create(self) -> UserBookCreate:
        """Convert to unified UserBookCreate."""
        return UserBookCreate(
            list_type=ListType.READING,
            finna_id=self.finna_id or f"manual_{self.title}",
            title=self.title,
            author=self.author,
            cover_image=self.cover_image,
            progress=self.progress,
            due_date=self.due_date,
            start_date=self.start_date,
            library_id=self.library_id,
            library_name=self.library_name,
            user_notes=self.user_notes,
        )


class CompletedItemCreate(BaseModel):
    """Convenience schema for adding to completed list."""

    finna_id: Optional[str] = None
    title: str
    author: Optional[str] = None
    cover_image: Optional[str] = None
    completed_date: str
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = None
    start_date: Optional[str] = None
    user_notes: Optional[str] = None

    def to_user_book_create(self) -> UserBookCreate:
        """Convert to unified UserBookCreate."""
        return UserBookCreate(
            list_type=ListType.COMPLETED,
            finna_id=self.finna_id or f"manual_{self.title}",
            title=self.title,
            author=self.author,
            cover_image=self.cover_image,
            completed_date=self.completed_date,
            rating=self.rating,
            review=self.review,
            start_date=self.start_date,
            user_notes=self.user_notes,
            progress=100,  # Completed = 100%
        )


class ReservationCreate(BaseModel):
    """Convenience schema for creating a reservation."""

    finna_id: str
    title: str
    author: Optional[str] = None
    cover_image: Optional[str] = None
    library_id: str
    library_name: str
    queue_position: Optional[int] = None
    estimated_wait_days: Optional[int] = None
    user_notes: Optional[str] = None

    def to_user_book_create(self) -> UserBookCreate:
        """Convert to unified UserBookCreate."""
        from datetime import datetime
        return UserBookCreate(
            list_type=ListType.RESERVED,
            finna_id=self.finna_id,
            title=self.title,
            author=self.author,
            cover_image=self.cover_image,
            library_id=self.library_id,
            library_name=self.library_name,
            queue_position=self.queue_position,
            estimated_wait_days=self.estimated_wait_days,
            status=ReservationStatus.PENDING,
            reservation_date=datetime.utcnow().isoformat(),
            user_notes=self.user_notes,
        )
