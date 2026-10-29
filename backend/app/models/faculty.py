import enum
from sqlalchemy import Column, String, Date, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class FacultyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ON_LEAVE = "ON_LEAVE"
    INACTIVE = "INACTIVE"


class Faculty(Base, TimestampMixin):
    __tablename__ = "faculty"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    faculty_code = Column(String(50), unique=True, index=True, nullable=False)
    designation = Column(String(100), default="Lecturer", nullable=False)
    qualification = Column(String(200), nullable=True)
    specialization = Column(String(200), nullable=True)
    joining_date = Column(Date, nullable=False)
    status = Column(Enum(FacultyStatus), default=FacultyStatus.ACTIVE, nullable=False)
    bio = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="faculty")
    batch_assignments = relationship("BatchFaculty", back_populates="faculty", cascade="all, delete-orphan")
    class_sessions = relationship("ClassSession", back_populates="faculty")
    attendance_sessions = relationship("AttendanceSession", back_populates="faculty")
    assignments_created = relationship("Assignment", back_populates="created_by_faculty")
    study_materials = relationship("StudyMaterial", back_populates="uploaded_by_faculty")
