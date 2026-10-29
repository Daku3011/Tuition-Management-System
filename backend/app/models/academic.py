import enum
from sqlalchemy import Column, String, Integer, Date, Time, Boolean, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class BatchStatus(str, enum.Enum):
    UPCOMING = "UPCOMING"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class EnrollmentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DROPPED = "DROPPED"
    COMPLETED = "COMPLETED"


class AcademicYear(Base, TimestampMixin):
    __tablename__ = "academic_years"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g., "2026-2027"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)

    institute = relationship("Institute", back_populates="academic_years")
    batches = relationship("Batch", back_populates="academic_year")


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    institute = relationship("Institute", back_populates="courses")
    subjects = relationship("Subject", back_populates="course", cascade="all, delete-orphan")
    batches = relationship("Batch", back_populates="course", cascade="all, delete-orphan")
    fee_plans = relationship("FeePlan", back_populates="course")


class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False)

    course = relationship("Course", back_populates="subjects")
    batch_assignments = relationship("BatchFaculty", back_populates="subject")
    class_sessions = relationship("ClassSession", back_populates="subject")
    assignments = relationship("Assignment", back_populates="subject")
    study_materials = relationship("StudyMaterial", back_populates="subject")
    exam_subjects = relationship("ExamSubject", back_populates="subject")


class Batch(Base, TimestampMixin):
    __tablename__ = "batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False)
    capacity = Column(Integer, default=30, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    room_number = Column(String(50), nullable=True)
    meeting_link = Column(Text, nullable=True)
    status = Column(Enum(BatchStatus), default=BatchStatus.ONGOING, nullable=False)

    course = relationship("Course", back_populates="batches")
    academic_year = relationship("AcademicYear", back_populates="batches")
    faculty_assignments = relationship("BatchFaculty", back_populates="batch", cascade="all, delete-orphan")
    enrollments = relationship("BatchEnrollment", back_populates="batch", cascade="all, delete-orphan")
    class_sessions = relationship("ClassSession", back_populates="batch", cascade="all, delete-orphan")
    attendance_sessions = relationship("AttendanceSession", back_populates="batch")
    assignments = relationship("Assignment", back_populates="batch")
    study_materials = relationship("StudyMaterial", back_populates="batch")
    examinations = relationship("Examinations", back_populates="batch")


class BatchFaculty(Base, TimestampMixin):
    __tablename__ = "batch_faculty"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="Lead Instructor", nullable=False)

    batch = relationship("Batch", back_populates="faculty_assignments")
    faculty = relationship("Faculty", back_populates="batch_assignments")
    subject = relationship("Subject", back_populates="batch_assignments")

    __table_args__ = (UniqueConstraint("batch_id", "faculty_id", "subject_id", name="uq_batch_faculty_subject"),)


class BatchEnrollment(Base, TimestampMixin):
    __tablename__ = "batch_enrollments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    enrollment_date = Column(Date, nullable=False)
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.ACTIVE, nullable=False)
    roll_number = Column(String(50), nullable=True)

    batch = relationship("Batch", back_populates="enrollments")
    student = relationship("Student", back_populates="enrollments")

    __table_args__ = (UniqueConstraint("batch_id", "student_id", name="uq_batch_student_enrollment"),)


class ClassSession(Base, TimestampMixin):
    __tablename__ = "class_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(String(36), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False, index=True)
    
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room_or_link = Column(String(200), nullable=True)
    topic_summary = Column(Text, nullable=True)
    is_cancelled = Column(Boolean, default=False, nullable=False)

    batch = relationship("Batch", back_populates="class_sessions")
    subject = relationship("Subject", back_populates="class_sessions")
    faculty = relationship("Faculty", back_populates="class_sessions")
    attendance_sessions = relationship("AttendanceSession", back_populates="class_session")
