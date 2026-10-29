from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel
from app.models.attendance import AttendanceStatus


class AttendanceRecordEntry(BaseModel):
    student_id: str
    status: AttendanceStatus = AttendanceStatus.PRESENT
    remarks: Optional[str] = None


class AttendanceBatchSubmit(BaseModel):
    batch_id: str
    class_session_id: Optional[str] = None
    session_date: date
    title: Optional[str] = None
    topic_covered: Optional[str] = None
    records: List[AttendanceRecordEntry]


class AttendanceCorrectionRequest(BaseModel):
    new_status: AttendanceStatus
    reason: str


class AttendanceRecordResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    student_code: str
    status: AttendanceStatus
    remarks: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceSessionResponse(BaseModel):
    id: str
    batch_id: str
    batch_name: str
    faculty_id: str
    faculty_name: str
    session_date: date
    title: Optional[str] = None
    topic_covered: Optional[str] = None
    status: str
    total_students: int
    present_count: int
    absent_count: int
    records: List[AttendanceRecordResponse] = []

    class Config:
        from_attributes = True


class StudentAttendanceSummary(BaseModel):
    student_id: str
    total_classes: int
    present: int
    absent: int
    late: int
    excused: int
    attendance_percentage: float
