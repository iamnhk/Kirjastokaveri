"""API dependencies for cache and services."""

import asyncio
from typing import Annotated

from fastapi import Depends

from app.core.cache import CacheBackend, RedisCache, create_cache_backend
from app.core.config import Settings, get_settings
from app.services.finna import FinnaService

_cache_backend_lock = asyncio.Lock()
_cache_backend: CacheBackend | None = None


async def get_cache_backend(
    settings: Annotated[Settings, Depends(get_settings)]
) -> CacheBackend:
    """Get or create a cache backend instance."""
    global _cache_backend
    if _cache_backend is not None:
        return _cache_backend
    async with _cache_backend_lock:
        if _cache_backend is None:
            _cache_backend = await create_cache_backend(settings.redis_url)
    return _cache_backend  # type: ignore[return-value]


def get_finna_service(
    settings: Annotated[Settings, Depends(get_settings)]
) -> FinnaService:
    """Get a Finna service instance."""
    return FinnaService(settings=settings)


async def shutdown_cache_backend() -> None:
    """Shutdown the cache backend on application exit."""
    global _cache_backend
    if isinstance(_cache_backend, RedisCache):
        await _cache_backend.close()
    _cache_backend = None
