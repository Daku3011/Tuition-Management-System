from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.academic import Batch, Subject, BatchEnrollment, EnrollmentStatus
from app.models.homework import Assignment, AssignmentSubmission, SubmissionStatus
from app.models.base import utc_now
from app.schemas.homework import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    SubmissionCreate,
    SubmissionReviewRequest,
    AssignmentSubmissionResponse,
)
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_staff, require_student

router = APIRouter()


def serialize_assignment(a: Assignment, db: Session) -> AssignmentResponse:
    batch_name = a.batch.name if a.batch else ""
    subject_name = a.subject.name if a.subject else ""
    fac_name = (
        a.created_by_faculty.user.profile.full_name
        if (a.created_by_faculty and a.created_by_faculty.user and a.created_by_faculty.user.profile)
        else "Faculty"
    )

    total_subs = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == a.id).count()
    reviewed_subs = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == a.id,
        AssignmentSubmission.status == SubmissionStatus.REVIEWED
    ).count()

    return AssignmentResponse(
        id=a.id,
        institute_id=a.institute_id,
        batch_id=a.batch_id,
        batch_name=batch_name,
        subject_id=a.subject_id,
        subject_name=subject_name,
        faculty_id=a.faculty_id,
        faculty_name=fac_name,
        title=a.title,
        description=a.description,
        due_date=a.due_date,
        max_marks=float(a.max_marks),
        attachment_url=a.attachment_url,
        status=a.status,
        created_at=a.created_at,
        total_submissions=total_subs,
        reviewed_submissions=reviewed_subs
    )


def serialize_submission(s: AssignmentSubmission) -> AssignmentSubmissionResponse:
    st_name = (
        s.student.user.profile.full_name
        if (s.student and s.student.user and s.student.user.profile)
        else "Student"
    )
    st_code = s.student.student_id_code if s.student else ""

    return AssignmentSubmissionResponse(
        id=s.id,
        assignment_id=s.assignment_id,
        assignment_title=s.assignment.title if s.assignment else "",
        student_id=s.student_id,
        student_name=st_name,
        student_code=st_code,
        submission_date=s.submission_date,
        content=s.content,
        attachment_url=s.attachment_url,
        status=s.status,
        marks_obtained=float(s.marks_obtained) if s.marks_obtained is not None else None,
        max_marks=float(s.assignment.max_marks) if s.assignment else 100.0,
        feedback=s.feedback,
        reviewed_at=s.reviewed_at
    )


@router.get("", response_model=ApiResponse[List[AssignmentResponse]])
def list_assignments(
    batch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Assignment).filter(Assignment.institute_id == current_user.institute_id)

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            enrolled_batch_ids = [
                e.batch_id for e in db.query(BatchEnrollment).filter(
                    BatchEnrollment.student_id == student.id,
                    BatchEnrollment.status == EnrollmentStatus.ACTIVE
                ).all()
            ]
            query = query.filter(Assignment.batch_id.in_(enrolled_batch_ids))
        else:
            return ApiResponse(data=[])

    if batch_id:
        query = query.filter(Assignment.batch_id == batch_id)

    assignments = query.order_by(Assignment.due_date.desc()).all()
    return ApiResponse(data=[serialize_assignment(a, db) for a in assignments])


@router.post("", response_model=ApiResponse[AssignmentResponse])
def create_assignment(
    payload: AssignmentCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    faculty = None
    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    else:
        faculty = db.query(Faculty).filter(Faculty.institute_id == current_user.institute_id).first()

    if not faculty:
        raise HTTPException(status_code=400, detail="Faculty record required to author assignment")

    assignment = Assignment(
        institute_id=current_user.institute_id,
        batch_id=payload.batch_id,
        subject_id=payload.subject_id,
        faculty_id=faculty.id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        max_marks=payload.max_marks,
        attachment_url=payload.attachment_url,
        status="ACTIVE"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return ApiResponse(data=serialize_assignment(assignment, db), message="Homework assignment published")


@router.get("/{id}", response_model=ApiResponse[AssignmentResponse])
def get_assignment(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(
        Assignment.id == id,
        Assignment.institute_id == current_user.institute_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    return ApiResponse(data=serialize_assignment(assignment, db))


@router.post("/{id}/submit", response_model=ApiResponse[AssignmentSubmissionResponse])
def submit_homework(
    id: str,
    payload: SubmissionCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(
        Assignment.id == id,
        Assignment.institute_id == current_user.institute_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    existing_sub = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment.id,
        AssignmentSubmission.student_id == student.id
    ).first()

    is_late = utc_now() > assignment.due_date.replace(tzinfo=timezone.utc)
    sub_status = SubmissionStatus.LATE if is_late else SubmissionStatus.SUBMITTED

    if existing_sub:
        existing_sub.content = payload.content
        existing_sub.attachment_url = payload.attachment_url or existing_sub.attachment_url
        existing_sub.submission_date = utc_now()
        existing_sub.status = sub_status
        db.commit()
        db.refresh(existing_sub)
        return ApiResponse(data=serialize_submission(existing_sub), message="Submission updated successfully")

    submission = AssignmentSubmission(
        assignment_id=assignment.id,
        student_id=student.id,
        submission_date=utc_now(),
        content=payload.content,
        attachment_url=payload.attachment_url,
        status=sub_status
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return ApiResponse(data=serialize_submission(submission), message="Homework submitted successfully")


@router.get("/{id}/submissions", response_model=ApiResponse[List[AssignmentSubmissionResponse]])
def list_submissions(
    id: str,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == id).all()
    return ApiResponse(data=[serialize_submission(s) for s in submissions])


@router.post("/submissions/{submission_id}/review", response_model=ApiResponse[AssignmentSubmissionResponse])
def review_submission(
    submission_id: str,
    payload: SubmissionReviewRequest,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission.marks_obtained = payload.marks_obtained
    submission.feedback = payload.feedback
    submission.status = SubmissionStatus.REVIEWED
    submission.reviewed_by_user_id = current_user.id
    submission.reviewed_at = utc_now()

    db.commit()
    db.refresh(submission)

    return ApiResponse(data=serialize_submission(submission), message="Submission graded and feedback provided")
