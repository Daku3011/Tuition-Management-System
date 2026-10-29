import logging
import time
from datetime import datetime, timezone
from typing import List, Optional

logger = logging.getLogger(__name__)


def send_notification_email_task(
    recipient_email: str,
    subject: str,
    body: str,
    sender: Optional[str] = None
) -> dict:
    """
    Background worker task to dispatch transactional emails
    (invitations, payment receipts, announcements).
    """
    logger.info(f"[JOB] Dispatching email to {recipient_email} - Subject: {subject}")
    # Simulate external SMTP / API latency (e.g. Resend / SendGrid / Amazon SES)
    time.sleep(0.5)

    timestamp = datetime.now(timezone.utc).isoformat()
    result = {
        "status": "DELIVERED",
        "recipient": recipient_email,
        "subject": subject,
        "delivered_at": timestamp,
    }
    logger.info(f"[JOB-SUCCESS] Email delivered to {recipient_email} at {timestamp}")
    return result


def generate_fee_receipt_async_task(
    payment_id: str,
    student_id: str,
    amount: float,
    currency: str = "INR"
) -> dict:
    """
    Background worker task to generate PDF receipt and sync storage.
    """
    logger.info(f"[JOB] Generating PDF receipt for Payment #{payment_id} - Student #{student_id}")
    time.sleep(0.8)

    receipt_number = f"RCP-ASYNC-{int(time.time())}"
    result = {
        "status": "GENERATED",
        "payment_id": payment_id,
        "student_id": student_id,
        "receipt_number": receipt_number,
        "amount": amount,
        "currency": currency,
        "pdf_url": f"/api/v1/fees/receipts/{receipt_number}/pdf"
    }
    logger.info(f"[JOB-SUCCESS] PDF Receipt {receipt_number} generated successfully.")
    return result


def batch_attendance_alert_task(
    batch_name: str,
    session_date: str,
    absent_count: int,
    absent_student_names: List[str]
) -> dict:
    """
    Background worker task to trigger parent alerts when students are marked ABSENT.
    """
    logger.info(
        f"[JOB] Sending attendance notifications for Batch '{batch_name}' "
        f"on {session_date} ({absent_count} absent students)"
    )
    time.sleep(0.4)

    return {
        "status": "ALERTS_SENT",
        "batch_name": batch_name,
        "session_date": session_date,
        "alerted_students": absent_student_names,
        "dispatched_count": len(absent_student_names)
    }
