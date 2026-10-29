import pytest
from app.core.redis import get_redis_client, is_redis_available
from app.core.sessions import (
    create_user_session,
    is_session_valid,
    list_user_sessions,
    revoke_session,
    revoke_all_user_sessions,
)
from app.core.cache import get_cached_json, set_cached_json, invalidate_namespace, invalidate_key
from app.workers.queue import enqueue_task
from app.workers.tasks import send_notification_email_task, generate_fee_receipt_async_task


def test_redis_connection():
    """Verify Redis connection ping."""
    client = get_redis_client()
    assert client is not None
    assert is_redis_available() is True


def test_user_session_lifecycle():
    """Verify session creation, listing, validation, and revocation."""
    test_user_id = "test-user-uuid-1234"
    session_id_1 = create_user_session(test_user_id, user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)", ip_address="192.168.1.10")
    session_id_2 = create_user_session(test_user_id, user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)", ip_address="10.0.0.5")

    assert session_id_1 != session_id_2
    assert is_session_valid(test_user_id, session_id_1) is True
    assert is_session_valid(test_user_id, session_id_2) is True

    # List active sessions
    sessions = list_user_sessions(test_user_id, current_session_id=session_id_1)
    assert len(sessions) >= 2
    curr = next(s for s in sessions if s["session_id"] == session_id_1)
    assert curr["is_current"] is True
    assert "iPhone" in curr["device"]

    other = next(s for s in sessions if s["session_id"] == session_id_2)
    assert other["is_current"] is False
    assert "Windows" in other["device"]

    # Revoke single session
    revoked = revoke_session(test_user_id, session_id_2)
    assert revoked is True
    assert is_session_valid(test_user_id, session_id_2) is False
    assert is_session_valid(test_user_id, session_id_1) is True

    # Revoke all sessions
    revoke_all_user_sessions(test_user_id)
    assert is_session_valid(test_user_id, session_id_1) is False


def test_redis_caching_and_invalidation():
    """Verify caching with JSON serialization and namespace purging."""
    cache_key = "test_data_key_99"
    payload = {"kpi": 4200, "status": "ACTIVE", "items": ["Math", "Physics"]}

    # Set cache
    set_cached_json(cache_key, payload, ttl_seconds=60, namespace="test_ns")

    # Read cache
    cached = get_cached_json(cache_key)
    assert cached is not None
    assert cached["kpi"] == 4200
    assert cached["items"] == ["Math", "Physics"]

    # Invalidate namespace
    purged = invalidate_namespace("test_ns")
    assert purged >= 1

    # Should now be None
    assert get_cached_json(cache_key) is None


def test_background_queue_dispatch():
    """Verify background task enqueueing with Redis RQ."""
    result = enqueue_task(
        send_notification_email_task,
        "student@test.com",
        "Exam Notice",
        "Your exam timetable is published."
    )
    assert result["status"] in ("QUEUED", "COMPLETED_INLINE")
    if result.get("queued"):
        assert "job_id" in result
