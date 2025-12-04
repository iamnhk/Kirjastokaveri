"""Database models package."""

from app.models.user import User
from app.models.wishlist import WishlistItem
from app.models.reservation import Reservation, ReservationStatus as OldReservationStatus
from app.models.notification import Notification, NotificationType
from app.models.library import Library
from app.models.reading import ReadingItem
from app.models.completed import CompletedItem
from app.models.user_book import UserBook, ListType, ReservationStatus

__all__ = [
    "User",
    # New unified model
    "UserBook",
    "ListType",
    "ReservationStatus",
    # Legacy models (kept for migration)
    "WishlistItem",
    "Reservation",
    "OldReservationStatus",
    "ReadingItem",
    "CompletedItem",
    # Other models
    "Notification",
    "NotificationType",
    "Library",
]
