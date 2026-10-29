from sqlalchemy import Column, String, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Institute(Base, TimestampMixin):
    __tablename__ = "institutes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    logo_url = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    currency = Column(String(10), default="INR", nullable=False)
    timezone = Column(String(100), default="Asia/Kolkata", nullable=False)
    settings = Column(JSON, default=dict, nullable=False)

    # Relationships
    users = relationship("User", back_populates="institute", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="institute", cascade="all, delete-orphan")
    academic_years = relationship("AcademicYear", back_populates="institute", cascade="all, delete-orphan")
    fee_plans = relationship("FeePlan", back_populates="institute", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="institute", cascade="all, delete-orphan")
