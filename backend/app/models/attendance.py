import enum
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    EXCUSED = "EXCUSED"


class AttendanceSession(Base, TimestampMixin):
    __tablename__ = "attendance_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(String(36), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    class_session_id = Column(String(36), ForeignKey("class_sessions.id", ondelete="SET NULL"), nullable=True)
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False, index=True)
    session_date = Column(Date, nullable=False, index=True)
    title = Column(String(200), nullable=True)
    topic_covered = Column(Text, nullable=True)
    status = Column(String(20), default="SUBMITTED", nullable=False)  # DRAFT, SUBMITTED

    batch = relationship("Batch", back_populates="attendance_sessions")
    class_session = relationship("ClassSession", back_populates="attendance_sessions")
    faculty = relationship("Faculty", back_populates="attendance_sessions")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Base, TimestampMixin):
    __tablename__ = "attendance_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attendance_session_id = Column(String(36), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT, nullable=False)
    remarks = Column(String(255), nullable=True)
    recorded_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
    change_logs = relationship("AttendanceChangeLog", back_populates="attendance_record", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("attendance_session_id", "student_id", name="uq_session_student_attendance"),)


class AttendanceChangeLog(Base):
    __tablename__ = "attendance_change_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attendance_record_id = Column(String(36), ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(Enum(AttendanceStatus), nullable=False)
    new_status = Column(Enum(AttendanceStatus), nullable=False)
    reason = Column(Text, nullable=False)
    changed_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    attendance_record = relationship("AttendanceRecord", back_populates="change_logs")
