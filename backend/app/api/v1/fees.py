import io
from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Course
from app.models.finance import (
    FeePlan,
    StudentFeeAssignment,
    FeeInstallment,
    Payment,
    Receipt,
    FeeStatus,
    PaymentMethod,
    PaymentStatus,
)
from app.models.communication import AuditLog
from app.models.base import utc_now
from app.schemas.finance import (
    FeePlanCreate,
    FeePlanResponse,
    StudentFeeAssignRequest,
    StudentFeeAssignmentResponse,
    FeeInstallmentResponse,
    PaymentCreate,
    PaymentResponse,
    ReceiptResponse,
)
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_admin
from app.core.cache import invalidate_namespace
from app.workers.queue import enqueue_task
from app.workers.tasks import generate_fee_receipt_async_task

router = APIRouter()


def generate_receipt_number(db: Session, institute_id: str) -> str:
    count = db.query(Receipt).filter(Receipt.institute_id == institute_id).count()
    return f"RCP-{datetime.now().year}-{count + 1:05d}"


def serialize_assignment(fa: StudentFeeAssignment, db: Session) -> StudentFeeAssignmentResponse:
    student_name = (
        fa.student.user.profile.full_name
        if (fa.student and fa.student.user and fa.student.user.profile)
        else "Student"
    )
    plan_name = fa.fee_plan.name if fa.fee_plan else "Custom Plan"

    installments = db.query(FeeInstallment).filter(
        FeeInstallment.student_fee_assignment_id == fa.id
    ).order_by(FeeInstallment.installment_number).all()

    inst_responses = []
    total_paid = 0.0

    for inst in installments:
        paid = float(inst.paid_amount)
        amt = float(inst.amount)
        rem = max(0.0, amt - paid)
        total_paid += paid

        inst_responses.append(
            FeeInstallmentResponse(
                id=inst.id,
                installment_number=inst.installment_number,
                due_date=inst.due_date,
                amount=amt,
                paid_amount=paid,
                remaining_balance=rem,
                status=inst.status
            )
        )

    net = float(fa.net_amount)
    bal = max(0.0, net - total_paid)

    return StudentFeeAssignmentResponse(
        id=fa.id,
        student_id=fa.student_id,
        student_name=student_name,
        fee_plan_id=fa.fee_plan_id,
        fee_plan_name=plan_name,
        total_amount=float(fa.total_amount),
        discount_amount=float(fa.discount_amount),
        net_amount=net,
        total_paid=total_paid,
        balance_due=bal,
        status=fa.status,
        installments=inst_responses
    )


@router.get("/plans", response_model=ApiResponse[List[FeePlanResponse]])
def list_fee_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plans = db.query(FeePlan).filter(FeePlan.institute_id == current_user.institute_id).all()
    results = []
    for p in plans:
        results.append(
            FeePlanResponse(
                id=p.id,
                institute_id=p.institute_id,
                course_id=p.course_id,
                course_name=p.course.name if p.course else "",
                name=p.name,
                description=p.description,
                total_amount=float(p.total_amount),
                currency=p.currency,
                installments_count=p.installments_count
            )
        )
    return ApiResponse(data=results)


@router.post("/plans", response_model=ApiResponse[FeePlanResponse])
def create_fee_plan(
    payload: FeePlanCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == payload.course_id, Course.institute_id == admin.institute_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    plan = FeePlan(
        institute_id=admin.institute_id,
        course_id=payload.course_id,
        name=payload.name,
        description=payload.description,
        total_amount=payload.total_amount,
        currency=payload.currency,
        installments_count=payload.installments_count
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return ApiResponse(
        data=FeePlanResponse(
            id=plan.id,
            institute_id=plan.institute_id,
            course_id=plan.course_id,
            course_name=course.name,
            name=plan.name,
            description=plan.description,
            total_amount=float(plan.total_amount),
            currency=plan.currency,
            installments_count=plan.installments_count
        ),
        message="Fee plan created successfully"
    )


@router.post("/assign", response_model=ApiResponse[StudentFeeAssignmentResponse])
def assign_fee_plan(
    payload: StudentFeeAssignRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == payload.student_id, Student.institute_id == admin.institute_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    plan = db.query(FeePlan).filter(FeePlan.id == payload.fee_plan_id, FeePlan.institute_id == admin.institute_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Fee plan not found")

    discount = payload.discount_amount or 0.0
    net = max(0.0, float(plan.total_amount) - discount)

    assignment = StudentFeeAssignment(
        institute_id=admin.institute_id,
        student_id=student.id,
        fee_plan_id=plan.id,
        total_amount=plan.total_amount,
        discount_amount=discount,
        discount_reason=payload.discount_reason,
        net_amount=net,
        status=FeeStatus.PENDING
    )
    db.add(assignment)
    db.flush()

    if payload.custom_installments and len(payload.custom_installments) > 0:
        for item in payload.custom_installments:
            inst = FeeInstallment(
                student_fee_assignment_id=assignment.id,
                installment_number=item.installment_number,
                due_date=item.due_date,
                amount=item.amount,
                paid_amount=0.0,
                status=FeeStatus.PENDING
            )
            db.add(inst)
    else:
        # Default evenly spaced monthly installments
        count = plan.installments_count or 1
        per_inst = round(net / count, 2)
        for i in range(count):
            inst = FeeInstallment(
                student_fee_assignment_id=assignment.id,
                installment_number=i + 1,
                due_date=date.today() + timedelta(days=30 * (i + 1)),
                amount=per_inst,
                paid_amount=0.0,
                status=FeeStatus.PENDING
            )
            db.add(inst)

    db.commit()
    db.refresh(assignment)

    return ApiResponse(data=serialize_assignment(assignment, db), message="Fee plan assigned to student")


@router.get("/student/{student_id}", response_model=ApiResponse[List[StudentFeeAssignmentResponse]])
def get_student_fee_details(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id, Student.institute_id == current_user.institute_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    assignments = db.query(StudentFeeAssignment).filter(StudentFeeAssignment.student_id == student.id).all()
    return ApiResponse(data=[serialize_assignment(a, db) for a in assignments])


@router.post("/payments", response_model=ApiResponse[PaymentResponse])
def record_payment(
    payload: PaymentCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    assignment = db.query(StudentFeeAssignment).filter(
        StudentFeeAssignment.id == payload.fee_assignment_id,
        StudentFeeAssignment.institute_id == admin.institute_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Fee assignment not found")

    # Payment creation inside transaction
    payment = Payment(
        institute_id=admin.institute_id,
        student_id=payload.student_id,
        fee_assignment_id=payload.fee_assignment_id,
        installment_id=payload.installment_id,
        amount=payload.amount,
        currency="INR",
        payment_method=payload.payment_method,
        payment_date=utc_now(),
        transaction_reference=payload.transaction_reference,
        status=PaymentStatus.COMPLETED,
        notes=payload.notes,
        recorded_by_user_id=admin.id
    )
    db.add(payment)
    db.flush()

    # Generate unique receipt
    rcp_num = generate_receipt_number(db, admin.institute_id)
    receipt = Receipt(
        institute_id=admin.institute_id,
        payment_id=payment.id,
        receipt_number=rcp_num,
        receipt_date=date.today()
    )
    db.add(receipt)

    # Update installment if specified
    if payload.installment_id:
        installment = db.query(FeeInstallment).filter(FeeInstallment.id == payload.installment_id).first()
        if installment:
            installment.paid_amount = float(installment.paid_amount) + payload.amount
            if installment.paid_amount >= installment.amount:
                installment.status = FeeStatus.PAID
            else:
                installment.status = FeeStatus.PARTIAL

    # Check overall assignment status
    all_inst = db.query(FeeInstallment).filter(FeeInstallment.student_fee_assignment_id == assignment.id).all()
    total_paid_all = sum(float(i.paid_amount) for i in all_inst)
    if total_paid_all >= float(assignment.net_amount):
        assignment.status = FeeStatus.PAID
    elif total_paid_all > 0:
        assignment.status = FeeStatus.PARTIAL

    audit = AuditLog(
        institute_id=admin.institute_id,
        user_id=admin.id,
        action="PAYMENT_RECORDED",
        entity_type="Payment",
        entity_id=payment.id,
        details={"amount": payload.amount, "receipt_number": rcp_num, "method": payload.payment_method.value}
    )
    db.add(audit)
    db.commit()
    db.refresh(payment)

    # Invalidate dashboard cache
    invalidate_namespace("dashboard")

    # Enqueue background task for receipt processing & notification
    enqueue_task(
        generate_fee_receipt_async_task,
        payment.id,
        payload.student_id,
        float(payload.amount),
        "INR"
    )

    student_name = (
        assignment.student.user.profile.full_name
        if (assignment.student and assignment.student.user and assignment.student.user.profile)
        else "Student"
    )

    return ApiResponse(
        data=PaymentResponse(
            id=payment.id,
            student_id=payment.student_id,
            student_name=student_name,
            amount=float(payment.amount),
            currency=payment.currency,
            payment_method=payment.payment_method,
            payment_date=payment.payment_date,
            transaction_reference=payment.transaction_reference,
            status=payment.status,
            notes=payment.notes,
            receipt_number=rcp_num
        ),
        message="Payment recorded and receipt generated successfully"
    )


@router.get("/payments", response_model=ApiResponse[List[PaymentResponse]])
def list_payments(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Payment).filter(Payment.institute_id == current_user.institute_id)

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            query = query.filter(Payment.student_id == student.id)
        else:
            return ApiResponse(data=[])
    elif student_id:
        query = query.filter(Payment.student_id == student_id)

    payments = query.order_by(Payment.payment_date.desc()).limit(100).all()
    results = []
    for p in payments:
        st_name = (
            p.student.user.profile.full_name
            if (p.student and p.student.user and p.student.user.profile)
            else "Student"
        )
        rcp = p.receipt.receipt_number if p.receipt else None
        results.append(
            PaymentResponse(
                id=p.id,
                student_id=p.student_id,
                student_name=st_name,
                amount=float(p.amount),
                currency=p.currency,
                payment_method=p.payment_method,
                payment_date=p.payment_date,
                transaction_reference=p.transaction_reference,
                status=p.status,
                notes=p.notes,
                receipt_number=rcp
            )
        )

    return ApiResponse(data=results)


@router.get("/receipts/{receipt_number}/pdf")
def download_receipt_pdf(
    receipt_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    receipt = db.query(Receipt).filter(
        Receipt.receipt_number == receipt_number,
        Receipt.institute_id == current_user.institute_id
    ).first()

    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    payment = receipt.payment
    student = payment.student

    # Check permission
    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Generate PDF in-memory with ReportLab
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    p.setFillColor(colors.HexColor("#1e293b"))
    p.rect(0, height - 90, width, 90, fill=1, stroke=0)

    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 20)
    p.drawString(40, height - 45, "TUITION FEE RECEIPT")
    p.setFont("Helvetica", 11)
    p.drawString(40, height - 68, "Official Payment Confirmation & Tax Invoice")

    # Receipt Info
    p.setFillColor(colors.HexColor("#0f172a"))
    p.setFont("Helvetica-Bold", 12)
    p.drawString(40, height - 130, f"Receipt No: {receipt.receipt_number}")
    p.drawString(380, height - 130, f"Date: {receipt.receipt_date.strftime('%d %B %Y')}")

    # Separator Line
    p.setStrokeColor(colors.HexColor("#cbd5e1"))
    p.setLineWidth(1)
    p.line(40, height - 145, width - 40, height - 145)

    # Student Details Box
    student_name = student.user.profile.full_name if (student and student.user and student.user.profile) else "N/A"
    student_code = student.student_id_code if student else "N/A"
    guardian_name = student.guardian_name or "N/A"

    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, height - 175, "Student Details:")
    p.setFont("Helvetica", 10)
    p.drawString(40, height - 195, f"Name: {student_name}")
    p.drawString(40, height - 215, f"Student ID: {student_code}")
    p.drawString(40, height - 235, f"Guardian: {guardian_name}")

    # Payment Details Box
    p.setFont("Helvetica-Bold", 11)
    p.drawString(320, height - 175, "Transaction Info:")
    p.setFont("Helvetica", 10)
    p.drawString(320, height - 195, f"Payment Mode: {payment.payment_method.value}")
    p.drawString(320, height - 215, f"Reference: {payment.transaction_reference or 'N/A'}")
    p.drawString(320, height - 235, f"Status: {payment.status.value}")

    # Table Header
    p.setFillColor(colors.HexColor("#f1f5f9"))
    p.rect(40, height - 290, width - 80, 25, fill=1, stroke=0)
    p.setFillColor(colors.HexColor("#334155"))
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, height - 275, "Description")
    p.drawString(420, height - 275, "Amount (INR)")

    # Table Row
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor("#0f172a"))
    desc = f"Tuition Fee Installment Payment"
    p.drawString(50, height - 315, desc)
    p.drawString(420, height - 315, f"INR {float(payment.amount):,.2f}")

    p.line(40, height - 330, width - 40, height - 330)

    # Total Row
    p.setFont("Helvetica-Bold", 12)
    p.drawString(300, height - 360, "Total Paid:")
    p.drawString(420, height - 360, f"INR {float(payment.amount):,.2f}")

    # Footer
    p.setFont("Helvetica", 9)
    p.setFillColor(colors.HexColor("#64748b"))
    p.drawString(40, 60, "This is a computer-generated receipt and requires no physical signature.")
    p.drawString(40, 45, "Tuition Management System • Secure Transaction Verification")

    p.showPage()
    p.save()

    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Receipt-{receipt.receipt_number}.pdf"}
    )
