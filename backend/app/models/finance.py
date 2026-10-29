import enum
from sqlalchemy import Column, String, Numeric, Integer, Date, DateTime, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class FeeStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    ONLINE = "ONLINE"
    UPI = "UPI"
    CHEQUE = "CHEQUE"


class PaymentStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class FeePlan(Base, TimestampMixin):
    __tablename__ = "fee_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    total_amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    installments_count = Column(Integer, default=1, nullable=False)

    institute = relationship("Institute", back_populates="fee_plans")
    course = relationship("Course", back_populates="fee_plans")
    student_assignments = relationship("StudentFeeAssignment", back_populates="fee_plan")


class StudentFeeAssignment(Base, TimestampMixin):
    __tablename__ = "student_fee_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    fee_plan_id = Column(String(36), ForeignKey("fee_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    
    total_amount = Column(Numeric(12, 2), nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    discount_reason = Column(String(200), nullable=True)
    net_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(FeeStatus), default=FeeStatus.PENDING, nullable=False)

    student = relationship("Student", back_populates="fee_assignments")
    fee_plan = relationship("FeePlan", back_populates="student_assignments")
    installments = relationship("FeeInstallment", back_populates="fee_assignment", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="fee_assignment")


class FeeInstallment(Base, TimestampMixin):
    __tablename__ = "fee_installments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_fee_assignment_id = Column(String(36), ForeignKey("student_fee_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    paid_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    status = Column(Enum(FeeStatus), default=FeeStatus.PENDING, nullable=False)

    fee_assignment = relationship("StudentFeeAssignment", back_populates="installments")
    payments = relationship("Payment", back_populates="installment")


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    fee_assignment_id = Column(String(36), ForeignKey("student_fee_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    installment_id = Column(String(36), ForeignKey("fee_installments.id", ondelete="SET NULL"), nullable=True)
    
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH, nullable=False)
    payment_date = Column(DateTime, nullable=False)
    transaction_reference = Column(String(100), nullable=True)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.COMPLETED, nullable=False)
    notes = Column(Text, nullable=True)
    recorded_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    student = relationship("Student", back_populates="payments")
    fee_assignment = relationship("StudentFeeAssignment", back_populates="payments")
    installment = relationship("FeeInstallment", back_populates="payments")
    receipt = relationship("Receipt", back_populates="payment", uselist=False, cascade="all, delete-orphan")


class Receipt(Base, TimestampMixin):
    __tablename__ = "receipts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_id = Column(String(36), ForeignKey("payments.id", ondelete="CASCADE"), unique=True, nullable=False)
    receipt_number = Column(String(50), unique=True, index=True, nullable=False)
    receipt_date = Column(Date, nullable=False)
    pdf_url = Column(Text, nullable=True)

    payment = relationship("Payment", back_populates="receipt")
