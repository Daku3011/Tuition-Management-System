import sys
import logging
from rq import Worker, Queue, Connection
from app.core.redis import get_redis_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("tms_worker")

if __name__ == "__main__":
    client = get_redis_client()
    if client is None:
        logger.error("Cannot start worker: Redis client is not available. Please verify REDIS_URL.")
        sys.exit(1)

    listen_queues = ["tms_jobs", "default"]
    logger.info(f"Starting TMS Redis Queue Worker listening on: {listen_queues}...")
    
    with Connection(client):
        worker = Worker(map(Queue, listen_queues))
        worker.work(with_scheduler=True)
