from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.academic import Batch, BatchEnrollment, EnrollmentStatus
from app.models.attendance import (
    AttendanceSession,
    AttendanceRecord,
    AttendanceStatus,
    AttendanceChangeLog,
)
from app.models.communication import AuditLog
from app.schemas.attendance import (
    AttendanceBatchSubmit,
    AttendanceCorrectionRequest,
    AttendanceRecordResponse,
    AttendanceSessionResponse,
    StudentAttendanceSummary,
)
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_staff
from app.core.cache import invalidate_namespace
from app.workers.queue import enqueue_task
from app.workers.tasks import batch_attendance_alert_task

router = APIRouter()


def serialize_session_response(session: AttendanceSession, db: Session) -> AttendanceSessionResponse:
    batch_name = session.batch.name if session.batch else ""
    faculty_name = (
        session.faculty.user.profile.full_name
        if (session.faculty and session.faculty.user and session.faculty.user.profile)
        else "Faculty"
    )

    records = db.query(AttendanceRecord).filter(AttendanceRecord.attendance_session_id == session.id).all()
    record_responses = []
    present_cnt = 0
    absent_cnt = 0

    for r in records:
        st_name = (
            r.student.user.profile.full_name
            if (r.student and r.student.user and r.student.user.profile)
            else "Student"
        )
        st_code = r.student.student_id_code if r.student else ""
        if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE]:
            present_cnt += 1
        elif r.status == AttendanceStatus.ABSENT:
            absent_cnt += 1

        record_responses.append(
            AttendanceRecordResponse(
                id=r.id,
                student_id=r.student_id,
                student_name=st_name,
                student_code=st_code,
                status=r.status,
                remarks=r.remarks,
                updated_at=r.updated_at
            )
        )

    return AttendanceSessionResponse(
        id=session.id,
        batch_id=session.batch_id,
        batch_name=batch_name,
        faculty_id=session.faculty_id,
        faculty_name=faculty_name,
        session_date=session.session_date,
        title=session.title,
        topic_covered=session.topic_covered,
        status=session.status,
        total_students=len(records),
        present_count=present_cnt,
        absent_count=absent_cnt,
        records=record_responses
    )


@router.post("/submit", response_model=ApiResponse[AttendanceSessionResponse])
def submit_batch_attendance(
    payload: AttendanceBatchSubmit,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    batch = db.query(Batch).filter(Batch.id == payload.batch_id, Batch.institute_id == current_user.institute_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Determine faculty ID
    faculty_id = None
    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty profile not found")
        faculty_id = faculty.id
    else:
        # If admin is recording, pick lead faculty or first assigned faculty
        first_fac = db.query(Faculty).filter(Faculty.institute_id == current_user.institute_id).first()
        faculty_id = first_fac.id if first_fac else None

    # Check for existing session on same batch and date
    existing_session = db.query(AttendanceSession).filter(
        AttendanceSession.batch_id == batch.id,
        AttendanceSession.session_date == payload.session_date
    ).first()

    if existing_session:
        session = existing_session
        session.topic_covered = payload.topic_covered or session.topic_covered
    else:
        session = AttendanceSession(
            institute_id=current_user.institute_id,
            batch_id=batch.id,
            class_session_id=payload.class_session_id,
            faculty_id=faculty_id or current_user.id,
            session_date=payload.session_date,
            title=payload.title or f"Class on {payload.session_date}",
            topic_covered=payload.topic_covered,
            status="SUBMITTED"
        )
        db.add(session)
        db.flush()

    # Insert or update records
    absent_student_ids = []
    for rec in payload.records:
        if rec.status == AttendanceStatus.ABSENT:
            absent_student_ids.append(rec.student_id)

        existing_rec = db.query(AttendanceRecord).filter(
            AttendanceRecord.attendance_session_id == session.id,
            AttendanceRecord.student_id == rec.student_id
        ).first()

        if existing_rec:
            existing_rec.status = rec.status
            existing_rec.remarks = rec.remarks
            existing_rec.recorded_by_user_id = current_user.id
        else:
            new_rec = AttendanceRecord(
                attendance_session_id=session.id,
                student_id=rec.student_id,
                status=rec.status,
                remarks=rec.remarks,
                recorded_by_user_id=current_user.id
            )
            db.add(new_rec)

    audit = AuditLog(
        institute_id=current_user.institute_id,
        user_id=current_user.id,
        action="ATTENDANCE_RECORDED",
        entity_type="AttendanceSession",
        entity_id=session.id,
        details={"batch_id": batch.id, "date": str(payload.session_date), "count": len(payload.records)}
    )
    db.add(audit)
    db.commit()
    db.refresh(session)

    # Invalidate cached dashboard stats across the institute
    invalidate_namespace("dashboard")

    # Enqueue Redis Background Task to notify guardians of absent students
    if absent_student_ids:
        enqueue_task(
            batch_attendance_alert_task,
            batch.name,
            str(payload.session_date),
            len(absent_student_ids),
            absent_student_ids
        )

    return ApiResponse(data=serialize_session_response(session, db), message="Attendance submitted successfully")


@router.get("/sessions", response_model=ApiResponse[List[AttendanceSessionResponse]])
def list_attendance_sessions(
    batch_id: Optional[str] = None,
    session_date: Optional[date] = None,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceSession).filter(AttendanceSession.institute_id == current_user.institute_id)
    if batch_id:
        query = query.filter(AttendanceSession.batch_id == batch_id)
    if session_date:
        query = query.filter(AttendanceSession.session_date == session_date)

    sessions = query.order_by(AttendanceSession.session_date.desc()).limit(50).all()
    return ApiResponse(data=[serialize_session_response(s, db) for s in sessions])


@router.get("/session/{id}", response_model=ApiResponse[AttendanceSessionResponse])
def get_attendance_session(
    id: str,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == id,
        AttendanceSession.institute_id == current_user.institute_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")

    return ApiResponse(data=serialize_session_response(session, db))


@router.patch("/records/{id}/correct", response_model=ApiResponse[dict])
def correct_attendance_record(
    id: str,
    payload: AttendanceCorrectionRequest,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    prev_status = record.status
    record.status = payload.new_status

    change_log = AttendanceChangeLog(
        attendance_record_id=record.id,
        previous_status=prev_status,
        new_status=payload.new_status,
        reason=payload.reason,
        changed_by_user_id=current_user.id
    )
    db.add(change_log)

    audit = AuditLog(
        institute_id=current_user.institute_id,
        user_id=current_user.id,
        action="ATTENDANCE_CORRECTED",
        entity_type="AttendanceRecord",
        entity_id=record.id,
        details={
            "student_id": record.student_id,
            "old_status": prev_status.value,
            "new_status": payload.new_status.value,
            "reason": payload.reason
        }
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        data={"id": record.id, "new_status": payload.new_status.value},
        message="Attendance record corrected with audit log"
    )


@router.get("/student/{student_id}", response_model=ApiResponse[StudentAttendanceSummary])
def get_student_attendance_summary(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.institute_id == current_user.institute_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # If student, verify self access
    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).all()
    total = len(records)
    present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    excused = sum(1 for r in records if r.status == AttendanceStatus.EXCUSED)
    rate = round(((present + late) / total * 100), 1) if total > 0 else 100.0

    return ApiResponse(
        data=StudentAttendanceSummary(
            student_id=student.id,
            total_classes=total,
            present=present,
            absent=absent,
            late=late,
            excused=excused,
            attendance_percentage=rate
        )
    )
