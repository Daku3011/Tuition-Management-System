from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.homework import SubmissionStatus


class AssignmentBase(BaseModel):
    title: str
    description: str
    due_date: datetime
    max_marks: float = 100.0
    attachment_url: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    batch_id: str
    subject_id: str


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_marks: Optional[float] = None
    attachment_url: Optional[str] = None
    status: Optional[str] = None


class AssignmentResponse(AssignmentBase):
    id: str
    institute_id: str
    batch_id: str
    batch_name: str
    subject_id: str
    subject_name: str
    faculty_id: str
    faculty_name: str
    status: str
    created_at: datetime
    total_submissions: int = 0
    reviewed_submissions: int = 0

    class Config:
        from_attributes = True


class SubmissionCreate(BaseModel):
    content: Optional[str] = None
    attachment_url: Optional[str] = None


class SubmissionReviewRequest(BaseModel):
    marks_obtained: float
    feedback: Optional[str] = None


class AssignmentSubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    assignment_title: str
    student_id: str
    student_name: str
    student_code: str
    submission_date: datetime
    content: Optional[str] = None
    attachment_url: Optional[str] = None
    status: SubmissionStatus
    marks_obtained: Optional[float] = None
    max_marks: float
    feedback: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudyMaterialCreate(BaseModel):
    batch_id: str
    subject_id: str
    title: str
    description: Optional[str] = None
    file_url: str
    file_type: Optional[str] = None
    file_size_bytes: Optional[int] = None


class StudyMaterialResponse(BaseModel):
    id: str
    institute_id: str
    batch_id: str
    batch_name: str
    subject_id: str
    subject_name: str
    faculty_id: str
    faculty_name: str
    title: str
    description: Optional[str] = None
    file_url: str
    file_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
