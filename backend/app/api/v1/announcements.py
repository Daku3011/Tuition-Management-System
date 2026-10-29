from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import BatchEnrollment, EnrollmentStatus
from app.models.communication import Announcement, AudienceType
from app.schemas.communication import AnnouncementCreate, AnnouncementResponse
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_staff

router = APIRouter()


def serialize_announcement(a: Announcement) -> AnnouncementResponse:
    creator_name = (
        a.institute.users[0].profile.full_name
        if (a.institute and a.institute.users and a.institute.users[0].profile)
        else "Administration"
    )

    return AnnouncementResponse(
        id=a.id,
        institute_id=a.institute_id,
        title=a.title,
        content=a.content,
        target_audience=a.target_audience,
        batch_id=a.batch_id,
        priority=a.priority,
        published_at=a.published_at,
        created_by_name=creator_name
    )


@router.get("", response_model=ApiResponse[List[AnnouncementResponse]])
def list_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Announcement).filter(Announcement.institute_id == current_user.institute_id)

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        batch_ids = []
        if student:
            batch_ids = [
                e.batch_id for e in db.query(BatchEnrollment).filter(
                    BatchEnrollment.student_id == student.id,
                    BatchEnrollment.status == EnrollmentStatus.ACTIVE
                ).all()
            ]

        query = query.filter(
            or_(
                Announcement.target_audience == AudienceType.ALL,
                Announcement.target_audience == AudienceType.STUDENTS,
                Announcement.batch_id.in_(batch_ids)
            )
        )
    elif current_user.role == UserRole.FACULTY:
        query = query.filter(
            or_(
                Announcement.target_audience == AudienceType.ALL,
                Announcement.target_audience == AudienceType.FACULTY
            )
        )

    announcements = query.order_by(Announcement.published_at.desc()).limit(50).all()
    return ApiResponse(data=[serialize_announcement(a) for a in announcements])


@router.post("", response_model=ApiResponse[AnnouncementResponse])
def create_announcement(
    payload: AnnouncementCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    announcement = Announcement(
        institute_id=current_user.institute_id,
        title=payload.title,
        content=payload.content,
        target_audience=payload.target_audience,
        batch_id=payload.batch_id,
        priority=payload.priority,
        expires_at=payload.expires_at,
        created_by_user_id=current_user.id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    return ApiResponse(data=serialize_announcement(announcement), message="Announcement published")
