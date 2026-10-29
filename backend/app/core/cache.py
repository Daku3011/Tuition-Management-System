import json
import logging
from datetime import datetime, date
from typing import Any, Optional, Callable
from functools import wraps
from app.core.config import settings
from app.core.redis import get_redis_client

logger = logging.getLogger(__name__)


class CacheJSONEncoder(json.JSONEncoder):
    """Handles datetime and date objects during JSON caching."""
    def default(self, obj: Any) -> Any:
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def get_cached_json(key: str) -> Optional[Any]:
    """Retrieves and deserializes JSON from Redis cache."""
    client = get_redis_client()
    if client is None:
        return None

    try:
        data = client.get(f"tms:cache:{key}")
        if data:
            return json.loads(data)
    except Exception as exc:
        logger.debug(f"Cache get error for {key}: {exc}")
    return None


def set_cached_json(
    key: str,
    data: Any,
    ttl_seconds: int = 300,
    namespace: Optional[str] = None
) -> bool:
    """Stores a serialized JSON value in Redis with TTL and namespace index."""
    client = get_redis_client()
    if client is None:
        return False

    full_key = f"tms:cache:{key}"
    try:
        serialized = json.dumps(data, cls=CacheJSONEncoder)
        client.set(full_key, serialized, ex=ttl_seconds)

        if namespace:
            ns_key = f"tms:cache_ns:{namespace}"
            client.sadd(ns_key, full_key)
            client.expire(ns_key, ttl_seconds + 3600)
        return True
    except Exception as exc:
        logger.debug(f"Cache set error for {key}: {exc}")
        return False


def invalidate_namespace(namespace: str) -> int:
    """Purges all cached keys registered under a specific namespace."""
    client = get_redis_client()
    if client is None:
        return 0

    ns_key = f"tms:cache_ns:{namespace}"
    purged_count = 0
    try:
        keys = client.smembers(ns_key)
        if keys:
            pipeline = client.pipeline()
            for k in keys:
                pipeline.delete(k)
            pipeline.delete(ns_key)
            results = pipeline.execute()
            purged_count = len(keys)
        logger.info(f"Invalidated {purged_count} cache keys for namespace '{namespace}'")
    except Exception as exc:
        logger.debug(f"Cache invalidation error for namespace {namespace}: {exc}")

    return purged_count


def invalidate_key(key: str) -> bool:
    """Purges an individual cache key."""
    client = get_redis_client()
    if client is None:
        return False

    try:
        client.delete(f"tms:cache:{key}")
        return True
    except Exception:
        return False
