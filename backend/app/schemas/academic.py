from typing import Optional, List
from datetime import date, time
from pydantic import BaseModel
from app.models.academic import BatchStatus, EnrollmentStatus


class SubjectBase(BaseModel):
    name: str
    code: str


class SubjectCreate(SubjectBase):
    course_id: str


class SubjectResponse(SubjectBase):
    id: str
    course_id: str

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool = True


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase):
    id: str
    institute_id: str
    subjects: List[SubjectResponse] = []

    class Config:
        from_attributes = True


class AcademicYearBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_current: bool = False


class AcademicYearCreate(AcademicYearBase):
    pass


class AcademicYearResponse(AcademicYearBase):
    id: str
    institute_id: str

    class Config:
        from_attributes = True


class BatchBase(BaseModel):
    name: str
    code: str
    capacity: int = 30
    start_date: date
    end_date: Optional[date] = None
    room_number: Optional[str] = None
    meeting_link: Optional[str] = None
    status: BatchStatus = BatchStatus.ONGOING


class BatchCreate(BatchBase):
    course_id: str
    academic_year_id: Optional[str] = None


class BatchUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    room_number: Optional[str] = None
    meeting_link: Optional[str] = None
    status: Optional[BatchStatus] = None


class FacultyAssignmentItem(BaseModel):
    faculty_id: str
    faculty_name: str
    subject_id: str
    subject_name: str
    role: str


class BatchResponse(BatchBase):
    id: str
    institute_id: str
    course_id: str
    course_name: Optional[str] = None
    academic_year_id: Optional[str] = None
    enrolled_count: int = 0
    faculty_assignments: List[FacultyAssignmentItem] = []

    class Config:
        from_attributes = True


class BatchEnrollmentCreate(BaseModel):
    student_id: str
    roll_number: Optional[str] = None


class BatchEnrollmentResponse(BaseModel):
    id: str
    batch_id: str
    student_id: str
    student_name: str
    student_code: str
    enrollment_date: date
    status: EnrollmentStatus
    roll_number: Optional[str] = None


class ClassSessionCreate(BaseModel):
    batch_id: str
    subject_id: str
    faculty_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    room_or_link: Optional[str] = None
    topic_summary: Optional[str] = None


class ClassSessionResponse(BaseModel):
    id: str
    institute_id: str
    batch_id: str
    batch_name: str
    subject_id: str
    subject_name: str
    faculty_id: str
    faculty_name: str
    day_of_week: int
    start_time: str
    end_time: str
    room_or_link: Optional[str] = None
    topic_summary: Optional[str] = None
    is_cancelled: bool

    class Config:
        from_attributes = True
