"""Cache backend implementations for API response caching."""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

try:
    import redis.asyncio as redis
except ImportError:
    redis = None  # type: ignore

if TYPE_CHECKING:
    from redis.asyncio import Redis as RedisClient
else:
    RedisClient = Any


@dataclass
class CacheEntry:
    """In-memory cache entry with expiration."""

    value: Any
    expires_at: float


class CacheBackend:
    """Minimal async cache interface used for Finna responses."""

    async def get(self, key: str) -> Any | None:
        """Get a value from cache."""
        raise NotImplementedError

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        """Set a value in cache with TTL."""
        raise NotImplementedError

    async def close(self) -> None:
        """Close the cache connection."""
        return None


class MemoryCache(CacheBackend):
    """In-memory cache implementation for development/fallback."""

    def __init__(self) -> None:
        self._store: dict[str, CacheEntry] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            if entry.expires_at <= time.time():
                self._store.pop(key, None)
                return None
            return entry.value

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        async with self._lock:
            expires_at = time.time() + ttl_seconds
            self._store[key] = CacheEntry(value=value, expires_at=expires_at)


class RedisCache(CacheBackend):
    """Redis cache implementation for production."""

    def __init__(self, client: RedisClient) -> None:
        self._client = client

    async def get(self, key: str) -> Any | None:
        data = await self._client.get(key)
        if data is None:
            return None
        return data

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        await self._client.set(key, value, ex=ttl_seconds)

    async def close(self) -> None:
        await self._client.aclose()


async def create_cache_backend(redis_url: str | None) -> CacheBackend:
    """Instantiate a cache backend based on configuration."""
    if redis_url and redis is not None:
        try:
            client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
            # Test connection
            await client.ping()
            return RedisCache(client)
        except Exception:
            # Fall back to memory cache if Redis is unavailable
            pass
    return MemoryCache()
