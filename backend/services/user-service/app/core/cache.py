#!/usr/bin/env python3
"""
Redis Cache Management

Centralized caching functionality using Redis.
"""

import json
import pickle
from typing import Any, Optional, Union

import redis.asyncio as redis
from redis.asyncio import Redis

from app.core.config import settings


class CacheManager:
    """
    Redis cache manager.
    
    Provides high-level caching operations with serialization support.
    """
    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._redis: Optional[Redis] = None
    
    async def connect(self) -> None:
        """Connect to Redis."""
        self._redis = redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=False,  # We handle encoding ourselves
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )
        
        # Test connection
        await self._redis.ping()
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._redis:
            await self._redis.close()
            self._redis = None
    
    @property
    def redis(self) -> Redis:
        """Get Redis client."""
        if self._redis is None:
            raise RuntimeError("Cache manager not connected")
        return self._redis
    
    async def get(self, key: str, default: Any = None) -> Any:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            default: Default value if key not found
            
        Returns:
            Cached value or default
        """
        try:
            value = await self.redis.get(key)
            if value is None:
                return default
            
            # Try to deserialize as JSON first, then pickle
            try:
                return json.loads(value.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                return pickle.loads(value)
        except Exception:
            return default
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        serialize_json: bool = True
    ) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            serialize_json: Whether to use JSON serialization (faster)
            
        Returns:
            True if successful
        """
        try:
            # Serialize value
            if serialize_json:
                try:
                    serialized = json.dumps(value, default=str)
                except (TypeError, ValueError):
                    # Fall back to pickle for complex objects
                    serialized = pickle.dumps(value)
            else:
                serialized = pickle.dumps(value)
            
            # Set with optional TTL
            if ttl:
                return await self.redis.setex(key, ttl, serialized)
            else:
                return await self.redis.set(key, serialized)
        except Exception:
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key was deleted
        """
        try:
            result = await self.redis.delete(key)
            return result > 0
        except Exception:
            return False
    
    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists
        """
        try:
            return await self.redis.exists(key) > 0
        except Exception:
            return False
    
    async def expire(self, key: str, ttl: int) -> bool:
        """
        Set expiration time for key.
        
        Args:
            key: Cache key
            ttl: Time to live in seconds
            
        Returns:
            True if successful
        """
        try:
            return await self.redis.expire(key, ttl)
        except Exception:
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        Increment numeric value.
        
        Args:
            key: Cache key
            amount: Amount to increment
            
        Returns:
            New value or None if failed
        """
        try:
            return await self.redis.incrby(key, amount)
        except Exception:
            return None
    
    async def get_many(self, keys: list[str]) -> dict[str, Any]:
        """
        Get multiple values from cache.
        
        Args:
            keys: List of cache keys
            
        Returns:
            Dictionary of key-value pairs
        """
        if not keys:
            return {}
        
        try:
            values = await self.redis.mget(keys)
            result = {}
            
            for key, value in zip(keys, values):
                if value is not None:
                    try:
                        result[key] = json.loads(value.decode('utf-8'))
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        result[key] = pickle.loads(value)
            
            return result
        except Exception:
            return {}
    
    async def set_many(
        self,
        mapping: dict[str, Any],
        ttl: Optional[int] = None,
        serialize_json: bool = True
    ) -> bool:
        """
        Set multiple values in cache.
        
        Args:
            mapping: Dictionary of key-value pairs
            ttl: Time to live in seconds
            serialize_json: Whether to use JSON serialization
            
        Returns:
            True if successful
        """
        if not mapping:
            return True
        
        try:
            # Serialize all values
            serialized = {}
            for key, value in mapping.items():
                if serialize_json:
                    try:
                        serialized[key] = json.dumps(value, default=str)
                    except (TypeError, ValueError):
                        serialized[key] = pickle.dumps(value)
                else:
                    serialized[key] = pickle.dumps(value)
            
            # Set all values
            await self.redis.mset(serialized)
            
            # Set TTL if specified
            if ttl:
                pipe = self.redis.pipeline()
                for key in mapping.keys():
                    pipe.expire(key, ttl)
                await pipe.execute()
            
            return True
        except Exception:
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """
        Clear all keys matching pattern.
        
        Args:
            pattern: Key pattern (supports wildcards)
            
        Returns:
            Number of keys deleted
        """
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                return await self.redis.delete(*keys)
            return 0
        except Exception:
            return 0


# Global cache manager instance
cache_manager = CacheManager(settings.REDIS_URL)


# Cache key generators
def user_profile_key(user_id: str) -> str:
    """Generate cache key for user profile."""
    return f"user:profile:{user_id}"


def user_stats_key(user_id: str) -> str:
    """Generate cache key for user statistics."""
    return f"user:stats:{user_id}"


def user_activity_key(user_id: str, date: str) -> str:
    """Generate cache key for user daily activity."""
    return f"user:activity:{user_id}:{date}"


def user_followers_key(user_id: str) -> str:
    """Generate cache key for user followers."""
    return f"user:followers:{user_id}"


def user_following_key(user_id: str) -> str:
    """Generate cache key for user following."""
    return f"user:following:{user_id}"