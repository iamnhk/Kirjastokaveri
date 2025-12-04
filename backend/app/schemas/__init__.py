"""Pydantic schemas package."""

from app.schemas.auth import (
    RefreshTokenRequest,
    Token,
    TokenPayload,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.schemas.availability import AvailabilityItem, AvailabilityResponse
from app.schemas.search import FacetBucket, SearchResponse, SearchResultRecord, SearchType
from app.schemas.notification import NotificationResponse
from app.schemas.library import LibraryResponse
# New unified schemas
from app.schemas.user_book import (
    UserBookCreate,
    UserBookUpdate,
    UserBookResponse,
    WishlistItemCreate,
    ReadingItemCreate,
    CompletedItemCreate,
    ReservationCreate,
)
# Legacy schemas (kept for backward compatibility during migration)
from app.schemas.wishlist import (
    WishlistItemCreate as OldWishlistItemCreate,
    WishlistItemResponse,
    WishlistItemUpdate,
)
from app.schemas.reservation import (
    ReservationCreate as OldReservationCreate,
    ReservationResponse,
    ReservationUpdate,
)
from app.schemas.reading import (
    ReadingItemCreate as OldReadingItemCreate,
    ReadingItemResponse,
    ReadingItemUpdate,
)
from app.schemas.completed import (
    CompletedItemCreate as OldCompletedItemCreate,
    CompletedItemResponse,
    CompletedItemUpdate,
)

__all__ = [
    # Auth
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "TokenPayload",
    "RefreshTokenRequest",
    # Search
    "SearchType",
    "SearchResultRecord",
    "FacetBucket",
    "SearchResponse",
    # Availability
    "AvailabilityItem",
    "AvailabilityResponse",
    # Notification
    "NotificationResponse",
    # Library
    "LibraryResponse",
    # New unified schemas
    "UserBookCreate",
    "UserBookUpdate",
    "UserBookResponse",
    # Convenience schemas
    "WishlistItemCreate",
    "ReadingItemCreate",
    "CompletedItemCreate",
    "ReservationCreate",
    # Legacy schemas
    "OldWishlistItemCreate",
    "WishlistItemUpdate",
    "WishlistItemResponse",
    "OldReservationCreate",
    "ReservationUpdate",
    "ReservationResponse",
    "OldReadingItemCreate",
    "ReadingItemUpdate",
    "ReadingItemResponse",
    "OldCompletedItemCreate",
    "CompletedItemUpdate",
    "CompletedItemResponse",
]
