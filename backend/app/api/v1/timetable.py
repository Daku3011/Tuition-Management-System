from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.academic import ClassSession, Batch, Subject, BatchEnrollment, EnrollmentStatus
from app.schemas.academic import ClassSessionCreate, ClassSessionResponse
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_admin

router = APIRouter()


def serialize_session(cs: ClassSession) -> ClassSessionResponse:
    batch_name = cs.batch.name if cs.batch else ""
    subject_name = cs.subject.name if cs.subject else ""
    faculty_name = (
        cs.faculty.user.profile.full_name
        if (cs.faculty and cs.faculty.user and cs.faculty.user.profile)
        else "Faculty"
    )

    return ClassSessionResponse(
        id=cs.id,
        institute_id=cs.institute_id,
        batch_id=cs.batch_id,
        batch_name=batch_name,
        subject_id=cs.subject_id,
        subject_name=subject_name,
        faculty_id=cs.faculty_id,
        faculty_name=faculty_name,
        day_of_week=cs.day_of_week,
        start_time=cs.start_time.strftime("%H:%M") if cs.start_time else "00:00",
        end_time=cs.end_time.strftime("%H:%M") if cs.end_time else "00:00",
        room_or_link=cs.room_or_link,
        topic_summary=cs.topic_summary,
        is_cancelled=cs.is_cancelled
    )


@router.get("", response_model=ApiResponse[List[ClassSessionResponse]])
def get_timetable(
    batch_id: Optional[str] = None,
    faculty_id: Optional[str] = None,
    day_of_week: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ClassSession).filter(ClassSession.institute_id == current_user.institute_id)

    # If student is querying, restrict to their enrolled batches unless admin
    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            enrolled_batch_ids = [
                enr.batch_id
                for enr in db.query(BatchEnrollment).filter(
                    BatchEnrollment.student_id == student.id,
                    BatchEnrollment.status == EnrollmentStatus.ACTIVE
                ).all()
            ]
            query = query.filter(ClassSession.batch_id.in_(enrolled_batch_ids))
        else:
            return ApiResponse(data=[])

    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty and not batch_id:
            query = query.filter(ClassSession.faculty_id == faculty.id)

    if batch_id:
        query = query.filter(ClassSession.batch_id == batch_id)
    if faculty_id:
        query = query.filter(ClassSession.faculty_id == faculty_id)
    if day_of_week is not None:
        query = query.filter(ClassSession.day_of_week == day_of_week)

    sessions = query.order_by(ClassSession.day_of_week, ClassSession.start_time).all()
    return ApiResponse(data=[serialize_session(s) for s in sessions])


@router.post("", response_model=ApiResponse[ClassSessionResponse])
def create_class_session(
    payload: ClassSessionCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    batch = db.query(Batch).filter(Batch.id == payload.batch_id, Batch.institute_id == admin.institute_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    faculty = db.query(Faculty).filter(Faculty.id == payload.faculty_id, Faculty.institute_id == admin.institute_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    session_entry = ClassSession(
        institute_id=admin.institute_id,
        batch_id=payload.batch_id,
        subject_id=payload.subject_id,
        faculty_id=payload.faculty_id,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        room_or_link=payload.room_or_link,
        topic_summary=payload.topic_summary
    )
    db.add(session_entry)
    db.commit()
    db.refresh(session_entry)

    return ApiResponse(data=serialize_session(session_entry), message="Timetable class session created")
