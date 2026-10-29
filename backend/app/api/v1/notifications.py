from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.communication import Notification
from app.schemas.communication import NotificationResponse
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user

router = APIRouter()


@router.get("", response_model=ApiResponse[List[NotificationResponse]])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()

    return ApiResponse(data=[NotificationResponse.model_validate(n) for n in notifications])


@router.patch("/{id}/read", response_model=ApiResponse[dict])
def mark_notification_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()

    return ApiResponse(data={"is_read": True}, message="Notification marked as read")
