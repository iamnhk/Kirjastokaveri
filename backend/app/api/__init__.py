"""API router factory with versioned route registration."""

from fastapi import APIRouter

from app.api.routes import health

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])

__all__ = ["api_router"]
