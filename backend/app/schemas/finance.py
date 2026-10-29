from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel
from app.models.finance import FeeStatus, PaymentMethod, PaymentStatus


class FeePlanCreate(BaseModel):
    course_id: str
    name: str
    description: Optional[str] = None
    total_amount: float
    currency: str = "INR"
    installments_count: int = 1


class FeePlanResponse(BaseModel):
    id: str
    institute_id: str
    course_id: str
    course_name: str
    name: str
    description: Optional[str] = None
    total_amount: float
    currency: str
    installments_count: int

    class Config:
        from_attributes = True


class InstallmentPlanItem(BaseModel):
    installment_number: int
    due_date: date
    amount: float


class StudentFeeAssignRequest(BaseModel):
    student_id: str
    fee_plan_id: str
    discount_amount: float = 0.0
    discount_reason: Optional[str] = None
    custom_installments: Optional[List[InstallmentPlanItem]] = None


class FeeInstallmentResponse(BaseModel):
    id: str
    installment_number: int
    due_date: date
    amount: float
    paid_amount: float
    remaining_balance: float
    status: FeeStatus

    class Config:
        from_attributes = True


class StudentFeeAssignmentResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    fee_plan_id: str
    fee_plan_name: str
    total_amount: float
    discount_amount: float
    net_amount: float
    total_paid: float
    balance_due: float
    status: FeeStatus
    installments: List[FeeInstallmentResponse] = []

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    student_id: str
    fee_assignment_id: str
    installment_id: Optional[str] = None
    amount: float
    payment_method: PaymentMethod = PaymentMethod.CASH
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None


class ReceiptResponse(BaseModel):
    id: str
    payment_id: str
    receipt_number: str
    receipt_date: date
    student_name: str
    student_code: str
    amount: float
    currency: str
    payment_method: PaymentMethod
    pdf_url: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    amount: float
    currency: str
    payment_method: PaymentMethod
    payment_date: datetime
    transaction_reference: Optional[str] = None
    status: PaymentStatus
    notes: Optional[str] = None
    receipt_number: Optional[str] = None

    class Config:
        from_attributes = True
