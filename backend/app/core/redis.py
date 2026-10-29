import logging
from typing import Optional
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """
    Returns a singleton Redis client instance.
    Degrades gracefully to None if Redis is unreachable or disabled.
    """
    global _redis_client
    if not settings.REDIS_ENABLED:
        return None

    if _redis_client is not None:
        return _redis_client

    try:
        # Support rediss:// (TLS) or redis://
        _redis_client = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_timeout=2.0,
            socket_connect_timeout=2.0,
            retry_on_timeout=True,
            health_check_interval=30
        )
        # Test connection ping
        _redis_client.ping()
        logger.info(f"Connected to Redis at {settings.REDIS_URL}")
        return _redis_client
    except Exception as exc:
        logger.warning(f"Could not connect to Redis ({exc}). Degraded to in-memory/direct mode.")
        _redis_client = None
        return None


def is_redis_available() -> bool:
    """Check if Redis connection is active."""
    client = get_redis_client()
    if client is None:
        return False
    try:
        return bool(client.ping())
    except Exception:
        return False
