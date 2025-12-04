"""Route group packages for the public API."""

from app.api.routes import (
    auth,
    books,
    completed,
    health,
    libraries,
    notifications,
    reading,
    reservations,
    search,
    wishlist,
)

__all__ = [
    "auth",
    "books",
    "completed",
    "health",
    "libraries",
    "notifications",
    "reading",
    "reservations",
    "search",
    "wishlist",
]
