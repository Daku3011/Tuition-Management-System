import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid, utc_now


class AudienceType(str, enum.Enum):
    ALL = "ALL"
    FACULTY = "FACULTY"
    STUDENTS = "STUDENTS"
    BATCH = "BATCH"


class Announcement(Base, TimestampMixin):
    __tablename__ = "announcements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    target_audience = Column(Enum(AudienceType), default=AudienceType.ALL, nullable=False)
    batch_id = Column(String(36), ForeignKey("batches.id", ondelete="CASCADE"), nullable=True)
    priority = Column(String(20), default="NORMAL", nullable=False)  # LOW, NORMAL, HIGH, URGENT
    published_at = Column(DateTime, default=utc_now, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    institute = relationship("Institute", back_populates="announcements")


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    notification_type = Column(String(50), default="INFO", nullable=False)  # ACADEMIC, FEE, ATTENDANCE, GENERAL
    is_read = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # e.g. "STUDENT_CREATED", "ATTENDANCE_CORRECTED", "PAYMENT_RECORDED"
    entity_type = Column(String(50), nullable=False)  # "Student", "AttendanceRecord", "Payment"
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    details = Column(JSON, default=dict, nullable=False)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")
