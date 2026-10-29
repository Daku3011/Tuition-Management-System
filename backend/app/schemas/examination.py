from typing import Optional, List
from datetime import date
from pydantic import BaseModel
from app.models.examination import ExamStatus


class ExamSubjectItem(BaseModel):
    subject_id: str
    exam_date: date
    start_time: Optional[str] = "10:00"
    end_time: Optional[str] = "12:00"
    max_marks: float = 100.0
    passing_marks: float = 35.0


class ExaminationCreate(BaseModel):
    batch_id: str
    title: str
    exam_type: str = "Term Exam"
    start_date: date
    end_date: date
    subjects: List[ExamSubjectItem]


class ExamSubjectResponse(BaseModel):
    id: str
    subject_id: str
    subject_name: str
    exam_date: date
    max_marks: float
    passing_marks: float

    class Config:
        from_attributes = True


class ExaminationResponse(BaseModel):
    id: str
    institute_id: str
    batch_id: str
    batch_name: str
    title: str
    exam_type: str
    start_date: date
    end_date: date
    status: ExamStatus
    subjects: List[ExamSubjectResponse] = []

    class Config:
        from_attributes = True


class SingleResultEntry(BaseModel):
    student_id: str
    marks_obtained: float
    grade: Optional[str] = None
    remarks: Optional[str] = None


class BatchResultSubmit(BaseModel):
    exam_subject_id: str
    results: List[SingleResultEntry]


class ExamResultResponse(BaseModel):
    id: str
    exam_subject_id: str
    subject_name: str
    student_id: str
    student_name: str
    student_code: str
    marks_obtained: float
    max_marks: float
    passing_marks: float
    is_passed: bool
    grade: Optional[str] = None
    remarks: Optional[str] = None
    is_published: bool

    class Config:
        from_attributes = True
