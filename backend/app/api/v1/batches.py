from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.academic import (
    Batch,
    BatchStatus,
    BatchEnrollment,
    EnrollmentStatus,
    BatchFaculty,
    Subject,
    Course,
)
from app.schemas.academic import (
    BatchCreate,
    BatchUpdate,
    BatchResponse,
    FacultyAssignmentItem,
    BatchEnrollmentCreate,
    BatchEnrollmentResponse,
)
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_admin, require_staff

router = APIRouter()


def serialize_batch(batch: Batch, db: Session) -> BatchResponse:
    enrolled_count = db.query(BatchEnrollment).filter(
        BatchEnrollment.batch_id == batch.id,
        BatchEnrollment.status == EnrollmentStatus.ACTIVE
    ).count()

    faculty_items = []
    assignments = db.query(BatchFaculty).filter(BatchFaculty.batch_id == batch.id).all()
    for a in assignments:
        faculty_name = a.faculty.user.profile.full_name if (a.faculty and a.faculty.user and a.faculty.user.profile) else "Faculty"
        subject_name = a.subject.name if a.subject else "Subject"
        faculty_items.append(
            FacultyAssignmentItem(
                faculty_id=a.faculty_id,
                faculty_name=faculty_name,
                subject_id=a.subject_id,
                subject_name=subject_name,
                role=a.role
            )
        )

    return BatchResponse(
        id=batch.id,
        institute_id=batch.institute_id,
        course_id=batch.course_id,
        course_name=batch.course.name if batch.course else None,
        academic_year_id=batch.academic_year_id,
        name=batch.name,
        code=batch.code,
        capacity=batch.capacity,
        start_date=batch.start_date,
        end_date=batch.end_date,
        room_number=batch.room_number,
        meeting_link=batch.meeting_link,
        status=batch.status,
        enrolled_count=enrolled_count,
        faculty_assignments=faculty_items
    )


@router.get("", response_model=ApiResponse[List[BatchResponse]])
def list_batches(
    course_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Batch).filter(Batch.institute_id == current_user.institute_id)
    if course_id:
        query = query.filter(Batch.course_id == course_id)

    batches = query.order_by(Batch.start_date.desc()).all()
    return ApiResponse(data=[serialize_batch(b, db) for b in batches])


@router.post("", response_model=ApiResponse[BatchResponse])
def create_batch(
    payload: BatchCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == payload.course_id, Course.institute_id == admin.institute_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    batch = Batch(
        institute_id=admin.institute_id,
        course_id=payload.course_id,
        academic_year_id=payload.academic_year_id,
        name=payload.name,
        code=payload.code.upper(),
        capacity=payload.capacity,
        start_date=payload.start_date,
        end_date=payload.end_date,
        room_number=payload.room_number,
        meeting_link=payload.meeting_link,
        status=payload.status
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    return ApiResponse(data=serialize_batch(batch, db), message="Batch created successfully")


@router.get("/{id}/students", response_model=ApiResponse[List[BatchEnrollmentResponse]])
def get_batch_students(
    id: str,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    enrollments = db.query(BatchEnrollment).filter(
        BatchEnrollment.batch_id == id,
        BatchEnrollment.status == EnrollmentStatus.ACTIVE
    ).all()

    results = []
    for enr in enrollments:
        student = enr.student
        name = student.user.profile.full_name if (student and student.user and student.user.profile) else "Student"
        results.append(
            BatchEnrollmentResponse(
                id=enr.id,
                batch_id=enr.batch_id,
                student_id=enr.student_id,
                student_name=name,
                student_code=student.student_id_code if student else "",
                enrollment_date=enr.enrollment_date,
                status=enr.status,
                roll_number=enr.roll_number
            )
        )

    return ApiResponse(data=results)


@router.post("/{id}/enroll", response_model=ApiResponse[dict])
def enroll_student(
    id: str,
    payload: BatchEnrollmentCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    batch = db.query(Batch).filter(Batch.id == id, Batch.institute_id == admin.institute_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    student = db.query(Student).filter(Student.id == payload.student_id, Student.institute_id == admin.institute_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = db.query(BatchEnrollment).filter(
        BatchEnrollment.batch_id == id,
        BatchEnrollment.student_id == student.id
    ).first()

    if existing:
        if existing.status == EnrollmentStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Student is already enrolled in this batch")
        existing.status = EnrollmentStatus.ACTIVE
        db.commit()
        return ApiResponse(data={"enrollment_id": existing.id}, message="Student re-enrolled in batch")

    # Check capacity
    enrolled_count = db.query(BatchEnrollment).filter(
        BatchEnrollment.batch_id == batch.id,
        BatchEnrollment.status == EnrollmentStatus.ACTIVE
    ).count()

    if enrolled_count >= batch.capacity:
        raise HTTPException(status_code=400, detail=f"Batch has reached maximum capacity of {batch.capacity} students")

    enrollment = BatchEnrollment(
        batch_id=batch.id,
        student_id=student.id,
        enrollment_date=date.today(),
        status=EnrollmentStatus.ACTIVE,
        roll_number=payload.roll_number
    )
    db.add(enrollment)
    db.commit()

    return ApiResponse(data={"enrollment_id": enrollment.id}, message="Student enrolled successfully")


@router.post("/{id}/assign-faculty", response_model=ApiResponse[dict])
def assign_faculty_to_batch(
    id: str,
    faculty_id: str,
    subject_id: str,
    role: str = "Lead Instructor",
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    batch = db.query(Batch).filter(Batch.id == id, Batch.institute_id == admin.institute_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    faculty = db.query(Faculty).filter(Faculty.id == faculty_id, Faculty.institute_id == admin.institute_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    existing = db.query(BatchFaculty).filter(
        BatchFaculty.batch_id == batch.id,
        BatchFaculty.faculty_id == faculty.id,
        BatchFaculty.subject_id == subject.id
    ).first()

    if existing:
        existing.role = role
    else:
        assignment = BatchFaculty(
            batch_id=batch.id,
            faculty_id=faculty.id,
            subject_id=subject.id,
            role=role
        )
        db.add(assignment)

    db.commit()
    return ApiResponse(data={}, message="Faculty assigned to batch successfully")
