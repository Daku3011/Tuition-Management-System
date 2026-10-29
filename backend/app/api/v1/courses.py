from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.academic import Course, Subject
from app.schemas.academic import (
    CourseCreate,
    CourseResponse,
    SubjectBase,
    SubjectCreate,
    SubjectResponse,
)
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_admin

router = APIRouter()


@router.get("", response_model=ApiResponse[List[CourseResponse]])
def list_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    courses = db.query(Course).filter(Course.institute_id == current_user.institute_id).all()
    return ApiResponse(data=[CourseResponse.model_validate(c) for c in courses])


@router.post("", response_model=ApiResponse[CourseResponse])
def create_course(
    payload: CourseCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = Course(
        institute_id=admin.institute_id,
        name=payload.name,
        code=payload.code.upper(),
        description=payload.description,
        is_active=payload.is_active
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    return ApiResponse(data=CourseResponse.model_validate(course), message="Course created successfully")


@router.post("/{course_id}/subjects", response_model=ApiResponse[SubjectResponse])
def add_subject_to_course(
    course_id: str,
    payload: SubjectBase,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id, Course.institute_id == admin.institute_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    subject = Subject(
        course_id=course.id,
        name=payload.name,
        code=payload.code.upper()
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    return ApiResponse(data=SubjectResponse.model_validate(subject), message="Subject added to course")
