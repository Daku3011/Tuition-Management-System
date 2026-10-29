import enum
from sqlalchemy import Column, String, Date, Boolean, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class StudentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    ARCHIVED = "ARCHIVED"


class Student(Base, TimestampMixin):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id_code = Column(String(50), unique=True, index=True, nullable=False)
    admission_date = Column(Date, nullable=False)
    status = Column(Enum(StudentStatus), default=StudentStatus.ACTIVE, nullable=False)
    grade_level = Column(String(50), nullable=True)  # e.g. "Grade 10", "Standard 12"
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    
    # Guardian details
    guardian_name = Column(String(100), nullable=True)
    guardian_phone = Column(String(50), nullable=True)
    guardian_email = Column(String(255), nullable=True)
    guardian_relation = Column(String(50), nullable=True)
    
    # Medical & remarks
    medical_info = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student")
    enrollments = relationship("BatchEnrollment", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student")
    submissions = relationship("AssignmentSubmission", back_populates="student")
    exam_results = relationship("ExamResult", back_populates="student")
    fee_assignments = relationship("StudentFeeAssignment", back_populates="student")
    payments = relationship("Payment", back_populates="student")
