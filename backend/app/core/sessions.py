import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.redis import get_redis_client


def parse_device_info(user_agent: Optional[str]) -> str:
    """Extract a friendly device name from user-agent string."""
    if not user_agent:
        return "Unknown Device"

    ua = user_agent.lower()
    if "mobile" in ua or "android" in ua or "iphone" in ua or "expo" in ua:
        if "iphone" in ua:
            return "Apple iPhone"
        if "android" in ua:
            return "Android Device"
        return "Mobile App Client"
    
    if "macintosh" in ua or "mac os" in ua:
        return "Apple Mac"
    if "windows" in ua:
        return "Windows PC"
    if "linux" in ua:
        return "Linux PC"
    
    return "Web Browser"


def create_user_session(
    user_id: str,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None
) -> str:
    """
    Creates an isolated session record in Redis with device tracking.
    Returns the unique session_id (jti).
    """
    session_id = str(uuid.uuid4())
    client = get_redis_client()
    if client is None:
        return session_id

    now_iso = datetime.now(timezone.utc).isoformat()
    device = parse_device_info(user_agent)

    session_data = {
        "session_id": session_id,
        "user_id": user_id,
        "device": device,
        "user_agent": user_agent or "Unknown",
        "ip_address": ip_address or "Unknown",
        "created_at": now_iso,
        "last_active_at": now_iso,
        "is_revoked": "false",
    }

    session_key = f"tms:session:{user_id}:{session_id}"
    user_sessions_key = f"tms:user_sessions:{user_id}"

    try:
        pipeline = client.pipeline()
        pipeline.hset(session_key, mapping=session_data)
        pipeline.expire(session_key, settings.REDIS_SESSION_TTL_SECONDS)
        pipeline.sadd(user_sessions_key, session_id)
        pipeline.expire(user_sessions_key, settings.REDIS_SESSION_TTL_SECONDS)
        pipeline.execute()
    except Exception:
        pass

    return session_id


def is_session_valid(user_id: str, session_id: Optional[str]) -> bool:
    """
    Checks if the user session exists and is active.
    If Redis is down or session_id is None, gracefully allows signed JWT.
    """
    if not session_id:
        return True

    client = get_redis_client()
    if client is None:
        return True

    try:
        session_key = f"tms:session:{user_id}:{session_id}"
        session_exists = client.exists(session_key)
        if not session_exists:
            return False
        
        is_revoked = client.hget(session_key, "is_revoked")
        return is_revoked != "true"
    except Exception:
        return True


def touch_session(user_id: str, session_id: Optional[str]) -> None:
    """Updates the last_active_at timestamp for the session."""
    if not session_id:
        return

    client = get_redis_client()
    if client is None:
        return

    try:
        session_key = f"tms:session:{user_id}:{session_id}"
        client.hset(session_key, "last_active_at", datetime.now(timezone.utc).isoformat())
    except Exception:
        pass


def list_user_sessions(user_id: str, current_session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns all active device sessions for a user."""
    client = get_redis_client()
    if client is None:
        return []

    sessions: List[Dict[str, Any]] = []
    user_sessions_key = f"tms:user_sessions:{user_id}"

    try:
        session_ids = client.smembers(user_sessions_key)
        for sid in session_ids:
            session_key = f"tms:session:{user_id}:{sid}"
            raw = client.hgetall(session_key)
            if raw and raw.get("is_revoked") != "true":
                sessions.append({
                    "session_id": sid,
                    "device": raw.get("device", "Web Client"),
                    "ip_address": raw.get("ip_address", "Unknown"),
                    "created_at": raw.get("created_at"),
                    "last_active_at": raw.get("last_active_at"),
                    "is_current": sid == current_session_id
                })
    except Exception:
        pass

    # Sort most recently active first
    sessions.sort(key=lambda s: s.get("last_active_at") or "", reverse=True)
    return sessions


def revoke_session(user_id: str, session_id: str) -> bool:
    """Revokes a specific device session."""
    client = get_redis_client()
    if client is None:
        return False

    session_key = f"tms:session:{user_id}:{session_id}"
    user_sessions_key = f"tms:user_sessions:{user_id}"

    try:
        client.delete(session_key)
        client.srem(user_sessions_key, session_id)
        return True
    except Exception:
        return False


def revoke_all_user_sessions(user_id: str, except_session_id: Optional[str] = None) -> int:
    """
    Revokes all active sessions for a user (e.g. password change, security reset, account suspension).
    Optionally keeps the current session alive.
    """
    client = get_redis_client()
    if client is None:
        return 0

    user_sessions_key = f"tms:user_sessions:{user_id}"
    revoked_count = 0

    try:
        session_ids = client.smembers(user_sessions_key)
        for sid in session_ids:
            if except_session_id and sid == except_session_id:
                continue
            session_key = f"tms:session:{user_id}:{sid}"
            client.delete(session_key)
            client.srem(user_sessions_key, sid)
            revoked_count += 1
    except Exception:
        pass

    return revoked_count
