"""API router factory with versioned route registration."""

from fastapi import APIRouter

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

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, tags=["authentication"])
api_router.include_router(search.router, tags=["search"])
# New unified books API
api_router.include_router(books.router, tags=["books"])
# Legacy endpoints (kept for backward compatibility during migration)
api_router.include_router(wishlist.router, tags=["wishlist-legacy"])
api_router.include_router(reading.router, tags=["reading-legacy"])
api_router.include_router(completed.router, tags=["completed-legacy"])
api_router.include_router(reservations.router, tags=["reservations-legacy"])
api_router.include_router(notifications.router, tags=["notifications"])
api_router.include_router(libraries.router, tags=["libraries"])

__all__ = ["api_router"]
