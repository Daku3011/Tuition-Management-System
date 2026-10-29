from typing import Optional, List
from datetime import date
from pydantic import BaseModel, EmailStr
from app.models.faculty import FacultyStatus
from app.schemas.auth import UserResponse


class FacultyBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    designation: Optional[str] = "Lecturer"
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None


class FacultyCreate(FacultyBase):
    faculty_code: Optional[str] = None
    joining_date: Optional[date] = None


class FacultyUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    status: Optional[FacultyStatus] = None


class FacultyResponse(BaseModel):
    id: str
    user_id: str
    institute_id: str
    faculty_code: str
    designation: str
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    joining_date: date
    status: FacultyStatus
    bio: Optional[str] = None
    user: Optional[UserResponse] = None
    assigned_batches_count: Optional[int] = 0
    assigned_students_count: Optional[int] = 0

    class Config:
        from_attributes = True
