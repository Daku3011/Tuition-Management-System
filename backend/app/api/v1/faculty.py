from datetime import date, datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import generate_random_token, get_password_hash
from app.models.user import User, UserProfile, UserRole
from app.models.faculty import Faculty, FacultyStatus
from app.models.academic import Batch, BatchFaculty, BatchEnrollment, EnrollmentStatus, ClassSession
from app.models.communication import AuditLog
from app.schemas.faculty import (
    FacultyCreate,
    FacultyUpdate,
    FacultyResponse,
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.permissions.deps import get_current_user, require_admin, require_faculty, require_staff

router = APIRouter()


def generate_faculty_code(db: Session, institute_id: str) -> str:
    count = db.query(Faculty).filter(Faculty.institute_id == institute_id).count()
    return f"FAC-{datetime.now().year}-{count + 1:03d}"


def serialize_faculty(faculty: Faculty, db: Session) -> FacultyResponse:
    batch_count = db.query(BatchFaculty).filter(BatchFaculty.faculty_id == faculty.id).count()
    # Count unique enrolled students across assigned batches
    assigned_batches = db.query(BatchFaculty.batch_id).filter(BatchFaculty.faculty_id == faculty.id).subquery()
    student_count = db.query(BatchEnrollment).filter(
        BatchEnrollment.batch_id.in_(assigned_batches),
        BatchEnrollment.status == EnrollmentStatus.ACTIVE
    ).distinct(BatchEnrollment.student_id).count()

    return FacultyResponse(
        id=faculty.id,
        user_id=faculty.user_id,
        institute_id=faculty.institute_id,
        faculty_code=faculty.faculty_code,
        designation=faculty.designation,
        qualification=faculty.qualification,
        specialization=faculty.specialization,
        joining_date=faculty.joining_date,
        status=faculty.status,
        bio=faculty.bio,
        user=faculty.user,
        assigned_batches_count=batch_count,
        assigned_students_count=student_count
    )


@router.get("", response_model=ApiResponse[PaginatedResponse[FacultyResponse]])
def list_faculty(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    query = db.query(Faculty).filter(Faculty.institute_id == admin.institute_id)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.join(User).join(UserProfile).filter(
            or_(
                Faculty.faculty_code.ilike(search_fmt),
                User.email.ilike(search_fmt),
                UserProfile.first_name.ilike(search_fmt),
                UserProfile.last_name.ilike(search_fmt),
                Faculty.specialization.ilike(search_fmt)
            )
        )

    total = query.count()
    faculty_list = query.offset((page - 1) * limit).limit(limit).all()

    items = [serialize_faculty(f, db) for f in faculty_list]
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return ApiResponse(
        data=PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )


@router.post("", response_model=ApiResponse[FacultyResponse])
def create_faculty(
    payload: FacultyCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    invitation_token = generate_random_token(40)
    user = User(
        institute_id=admin.institute_id,
        email=payload.email.lower().strip(),
        role=UserRole.FACULTY,
        is_active=True,
        is_verified=False,
        invitation_token=invitation_token,
        invitation_expires_at=datetime.now(timezone.utc) + timedelta(days=14),
        hashed_password=get_password_hash("Faculty@123")
    )
    db.add(user)
    db.flush()

    profile = UserProfile(
        user_id=user.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        address=payload.address
    )
    db.add(profile)
    db.flush()

    code = payload.faculty_code or generate_faculty_code(db, admin.institute_id)
    faculty = Faculty(
        user_id=user.id,
        institute_id=admin.institute_id,
        faculty_code=code,
        designation=payload.designation or "Lecturer",
        qualification=payload.qualification,
        specialization=payload.specialization,
        joining_date=payload.joining_date or date.today(),
        status=FacultyStatus.ACTIVE,
        bio=payload.bio
    )
    db.add(faculty)

    audit = AuditLog(
        institute_id=admin.institute_id,
        user_id=admin.id,
        action="FACULTY_ONBOARDED",
        entity_type="Faculty",
        entity_id=faculty.id,
        details={"faculty_code": code, "name": f"{payload.first_name} {payload.last_name}"}
    )
    db.add(audit)
    db.commit()
    db.refresh(faculty)

    return ApiResponse(data=serialize_faculty(faculty, db), message="Faculty onboarded successfully")


@router.get("/me/classes", response_model=ApiResponse[List[dict]])
def get_faculty_assigned_classes(
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty record not found")

    assignments = db.query(BatchFaculty).filter(BatchFaculty.faculty_id == faculty.id).all()
    results = []
    for a in assignments:
        batch = a.batch
        enrolled_count = db.query(BatchEnrollment).filter(
            BatchEnrollment.batch_id == batch.id,
            BatchEnrollment.status == EnrollmentStatus.ACTIVE
        ).count()
        results.append({
            "batch_id": batch.id,
            "batch_name": batch.name,
            "batch_code": batch.code,
            "course_name": batch.course.name if batch.course else "",
            "subject_id": a.subject.id if a.subject else "",
            "subject_name": a.subject.name if a.subject else "",
            "role": a.role,
            "room_number": batch.room_number,
            "enrolled_count": enrolled_count
        })

    return ApiResponse(data=results)


@router.get("/{id}", response_model=ApiResponse[FacultyResponse])
def get_faculty_by_id(
    id: str,
    admin: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    faculty = db.query(Faculty).filter(
        Faculty.id == id,
        Faculty.institute_id == admin.institute_id
    ).first()

    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    return ApiResponse(data=serialize_faculty(faculty, db))


@router.put("/{id}", response_model=ApiResponse[FacultyResponse])
def update_faculty(
    id: str,
    payload: FacultyUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    faculty = db.query(Faculty).filter(
        Faculty.id == id,
        Faculty.institute_id == admin.institute_id
    ).first()

    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    if faculty.user and faculty.user.profile:
        if payload.first_name:
            faculty.user.profile.first_name = payload.first_name
        if payload.last_name:
            faculty.user.profile.last_name = payload.last_name
        if payload.phone:
            faculty.user.profile.phone = payload.phone
        if payload.address:
            faculty.user.profile.address = payload.address

    if payload.designation is not None:
        faculty.designation = payload.designation
    if payload.qualification is not None:
        faculty.qualification = payload.qualification
    if payload.specialization is not None:
        faculty.specialization = payload.specialization
    if payload.bio is not None:
        faculty.bio = payload.bio
    if payload.status is not None:
        faculty.status = payload.status

    db.commit()
    db.refresh(faculty)

    return ApiResponse(data=serialize_faculty(faculty, db), message="Faculty updated successfully")
