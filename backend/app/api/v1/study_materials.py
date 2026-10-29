from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.academic import BatchEnrollment, EnrollmentStatus
from app.models.homework import StudyMaterial
from app.schemas.homework import StudyMaterialCreate, StudyMaterialResponse
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_staff

router = APIRouter()


def serialize_material(m: StudyMaterial) -> StudyMaterialResponse:
    batch_name = m.batch.name if m.batch else ""
    subject_name = m.subject.name if m.subject else ""
    fac_name = (
        m.uploaded_by_faculty.user.profile.full_name
        if (m.uploaded_by_faculty and m.uploaded_by_faculty.user and m.uploaded_by_faculty.user.profile)
        else "Faculty"
    )

    return StudyMaterialResponse(
        id=m.id,
        institute_id=m.institute_id,
        batch_id=m.batch_id,
        batch_name=batch_name,
        subject_id=m.subject_id,
        subject_name=subject_name,
        faculty_id=m.faculty_id,
        faculty_name=fac_name,
        title=m.title,
        description=m.description,
        file_url=m.file_url,
        file_type=m.file_type,
        file_size_bytes=int(m.file_size_bytes) if m.file_size_bytes else None,
        created_at=m.created_at
    )


@router.get("", response_model=ApiResponse[List[StudyMaterialResponse]])
def list_study_materials(
    batch_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(StudyMaterial).filter(StudyMaterial.institute_id == current_user.institute_id)

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            enrolled_batch_ids = [
                e.batch_id for e in db.query(BatchEnrollment).filter(
                    BatchEnrollment.student_id == student.id,
                    BatchEnrollment.status == EnrollmentStatus.ACTIVE
                ).all()
            ]
            query = query.filter(StudyMaterial.batch_id.in_(enrolled_batch_ids))
        else:
            return ApiResponse(data=[])

    if batch_id:
        query = query.filter(StudyMaterial.batch_id == batch_id)
    if subject_id:
        query = query.filter(StudyMaterial.subject_id == subject_id)

    materials = query.order_by(StudyMaterial.created_at.desc()).all()
    return ApiResponse(data=[serialize_material(m) for m in materials])


@router.post("", response_model=ApiResponse[StudyMaterialResponse])
def create_study_material(
    payload: StudyMaterialCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    faculty = None
    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    else:
        faculty = db.query(Faculty).filter(Faculty.institute_id == current_user.institute_id).first()

    if not faculty:
        raise HTTPException(status_code=400, detail="Faculty required")

    material = StudyMaterial(
        institute_id=current_user.institute_id,
        batch_id=payload.batch_id,
        subject_id=payload.subject_id,
        faculty_id=faculty.id,
        title=payload.title,
        description=payload.description,
        file_url=payload.file_url,
        file_type=payload.file_type,
        file_size_bytes=payload.file_size_bytes
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    return ApiResponse(data=serialize_material(material), message="Study material published")
