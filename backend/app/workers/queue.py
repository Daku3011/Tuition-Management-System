import logging
from typing import Any, Callable, Optional, Dict
from rq import Queue
from app.core.redis import get_redis_client

logger = logging.getLogger(__name__)

_rq_queue: Optional[Queue] = None


def get_job_queue() -> Optional[Queue]:
    """Retrieves or initializes the primary Redis RQ Queue."""
    global _rq_queue
    if _rq_queue is not None:
        return _rq_queue

    client = get_redis_client()
    if client is None:
        return None

    try:
        _rq_queue = Queue("tms_jobs", connection=client, default_timeout=360)
        return _rq_queue
    except Exception as exc:
        logger.warning(f"Could not initialize Redis RQ Queue: {exc}")
        return None


def enqueue_task(func: Callable, *args: Any, **kwargs: Any) -> Dict[str, Any]:
    """
    Enqueues a background task to Redis.
    Falls back to immediate inline execution if Redis Queue is unavailable.
    """
    queue = get_job_queue()
    if queue is not None:
        try:
            job = queue.enqueue(func, *args, **kwargs)
            logger.info(f"Enqueued job {job.id} for task {func.__name__}")
            return {
                "queued": True,
                "job_id": job.id,
                "queue_name": queue.name,
                "status": "QUEUED"
            }
        except Exception as exc:
            logger.error(f"Failed to enqueue task to Redis queue: {exc}. Executing synchronously.")

    # Graceful fallback: Run task immediately
    try:
        func(*args, **kwargs)
        return {"queued": False, "status": "COMPLETED_INLINE"}
    except Exception as exc:
        logger.error(f"Inline task execution failed: {exc}")
        return {"queued": False, "status": "FAILED", "error": str(exc)}
