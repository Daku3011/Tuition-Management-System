from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, EmailStr
from app.models.student import StudentStatus
from app.schemas.auth import UserResponse


class StudentBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    grade_level: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[EmailStr] = None
    guardian_relation: Optional[str] = None
    address: Optional[str] = None
    medical_info: Optional[str] = None
    remarks: Optional[str] = None


class StudentCreate(StudentBase):
    student_id_code: Optional[str] = None  # auto-generated if omitted
    admission_date: Optional[date] = None
    batch_ids: Optional[List[str]] = []
    initial_fee_plan_id: Optional[str] = None
    discount_amount: Optional[float] = 0.0


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    grade_level: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[EmailStr] = None
    guardian_relation: Optional[str] = None
    address: Optional[str] = None
    medical_info: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[StudentStatus] = None


class BatchInfoSimple(BaseModel):
    id: str
    name: str
    code: str
    course_name: Optional[str] = None

    class Config:
        from_attributes = True


class StudentResponse(BaseModel):
    id: str
    user_id: str
    institute_id: str
    student_id_code: str
    admission_date: date
    status: StudentStatus
    grade_level: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[str] = None
    guardian_relation: Optional[str] = None
    remarks: Optional[str] = None
    is_archived: bool
    user: Optional[UserResponse] = None
    enrolled_batches: Optional[List[BatchInfoSimple]] = []
    attendance_rate: Optional[float] = None
    pending_fee_balance: Optional[float] = None

    class Config:
        from_attributes = True
