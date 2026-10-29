import enum
from sqlalchemy import Column, String, Numeric, Date, Time, Boolean, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class ExamStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    COMPLETED = "COMPLETED"


class Examinations(Base, TimestampMixin):
    __tablename__ = "examinations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(String(36), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    exam_type = Column(String(50), default="Term Exam", nullable=False)  # Unit Test, Mid Term, Final Exam
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(ExamStatus), default=ExamStatus.DRAFT, nullable=False)

    batch = relationship("Batch", back_populates="examinations")
    exam_subjects = relationship("ExamSubject", back_populates="examination", cascade="all, delete-orphan")


class ExamSubject(Base, TimestampMixin):
    __tablename__ = "exam_subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    examination_id = Column(String(36), ForeignKey("examinations.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    exam_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    max_marks = Column(Numeric(6, 2), default=100.00, nullable=False)
    passing_marks = Column(Numeric(6, 2), default=35.00, nullable=False)

    examination = relationship("Examinations", back_populates="exam_subjects")
    subject = relationship("Subject", back_populates="exam_subjects")
    results = relationship("ExamResult", back_populates="exam_subject", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("examination_id", "subject_id", name="uq_exam_subject"),)


class ExamResult(Base, TimestampMixin):
    __tablename__ = "exam_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    exam_subject_id = Column(String(36), ForeignKey("exam_subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    marks_obtained = Column(Numeric(6, 2), nullable=False)
    grade = Column(String(10), nullable=True)
    remarks = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    entered_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    exam_subject = relationship("ExamSubject", back_populates="results")
    student = relationship("Student", back_populates="exam_results")

    __table_args__ = (UniqueConstraint("exam_subject_id", "student_id", name="uq_exam_subject_student_result"),)
