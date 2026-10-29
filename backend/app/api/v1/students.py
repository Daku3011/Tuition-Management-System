import csv
import io
import random
from datetime import date, datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.core.security import generate_random_token, get_password_hash
from app.models.user import User, UserProfile, UserRole
from app.models.student import Student, StudentStatus
from app.models.academic import Batch, BatchEnrollment, EnrollmentStatus
from app.models.attendance import AttendanceRecord, AttendanceStatus
from app.models.finance import StudentFeeAssignment, FeePlan, FeeInstallment, FeeStatus
from app.models.communication import AuditLog
from app.models.base import utc_now
from app.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    BatchInfoSimple,
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.permissions.deps import get_current_user, require_admin, require_staff

router = APIRouter()


def generate_student_code(db: Session, institute_id: str) -> str:
    count = db.query(Student).filter(Student.institute_id == institute_id).count()
    return f"STU-{datetime.now().year}-{count + 1:04d}"


def serialize_student(student: Student, db: Session) -> StudentResponse:
    # Calculate attendance
    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).all()
    total_classes = len(records)
    present_classes = sum(1 for r in records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE])
    att_rate = round((present_classes / total_classes * 100), 1) if total_classes > 0 else 100.0

    # Calculate pending fee balance
    fee_assignments = db.query(StudentFeeAssignment).filter(StudentFeeAssignment.student_id == student.id).all()
    pending_fee = 0.0
    for fa in fee_assignments:
        installments = db.query(FeeInstallment).filter(FeeInstallment.student_fee_assignment_id == fa.id).all()
        for inst in installments:
            pending_fee += float(inst.amount - inst.paid_amount)

    batches_list = []
    for enr in student.enrollments:
        if enr.status == EnrollmentStatus.ACTIVE and enr.batch:
            batches_list.append(
                BatchInfoSimple(
                    id=enr.batch.id,
                    name=enr.batch.name,
                    code=enr.batch.code,
                    course_name=enr.batch.course.name if enr.batch.course else None
                )
            )

    return StudentResponse(
        id=student.id,
        user_id=student.user_id,
        institute_id=student.institute_id,
        student_id_code=student.student_id_code,
        admission_date=student.admission_date,
        status=student.status,
        grade_level=student.grade_level,
        date_of_birth=student.date_of_birth,
        gender=student.gender,
        guardian_name=student.guardian_name,
        guardian_phone=student.guardian_phone,
        guardian_email=student.guardian_email,
        guardian_relation=student.guardian_relation,
        remarks=student.remarks,
        is_archived=student.is_archived,
        user=student.user,
        enrolled_batches=batches_list,
        attendance_rate=att_rate,
        pending_fee_balance=pending_fee
    )


@router.get("", response_model=ApiResponse[PaginatedResponse[StudentResponse]])
def list_students(
    search: Optional[str] = None,
    batch_id: Optional[str] = None,
    status_filter: Optional[StudentStatus] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    query = db.query(Student).filter(
        Student.institute_id == current_user.institute_id,
        Student.is_archived == False
    )

    if status_filter:
        query = query.filter(Student.status == status_filter)

    if batch_id:
        query = query.join(BatchEnrollment).filter(
            BatchEnrollment.batch_id == batch_id,
            BatchEnrollment.status == EnrollmentStatus.ACTIVE
        )

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.join(User).join(UserProfile).filter(
            or_(
                Student.student_id_code.ilike(search_fmt),
                User.email.ilike(search_fmt),
                UserProfile.first_name.ilike(search_fmt),
                UserProfile.last_name.ilike(search_fmt),
                Student.guardian_name.ilike(search_fmt)
            )
        )

    total = query.count()
    students = query.offset((page - 1) * limit).limit(limit).all()

    items = [serialize_student(s, db) for s in students]

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return ApiResponse(
        data=PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )


@router.post("", response_model=ApiResponse[StudentResponse])
def create_student(
    payload: StudentCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    invitation_token = generate_random_token(40)
    user = User(
        institute_id=admin.institute_id,
        email=payload.email.lower().strip(),
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=False,
        invitation_token=invitation_token,
        invitation_expires_at=datetime.now(timezone.utc) + timedelta(days=14),
        # Default placeholder password for local demo/seeding testing (can be reset)
        hashed_password=get_password_hash("Student@123")
    )
    db.add(user)
    db.flush()

    profile = UserProfile(
        user_id=user.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        address=payload.address
    )
    db.add(profile)
    db.flush()

    student_code = payload.student_id_code or generate_student_code(db, admin.institute_id)
    student = Student(
        user_id=user.id,
        institute_id=admin.institute_id,
        student_id_code=student_code,
        admission_date=payload.admission_date or date.today(),
        status=StudentStatus.ACTIVE,
        grade_level=payload.grade_level,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        guardian_name=payload.guardian_name,
        guardian_phone=payload.guardian_phone,
        guardian_email=payload.guardian_email,
        guardian_relation=payload.guardian_relation,
        medical_info=payload.medical_info,
        remarks=payload.remarks,
    )
    db.add(student)
    db.flush()

    # Enroll in batches
    if payload.batch_ids:
        for b_id in payload.batch_ids:
            batch = db.query(Batch).filter(Batch.id == b_id, Batch.institute_id == admin.institute_id).first()
            if batch:
                enrollment = BatchEnrollment(
                    batch_id=batch.id,
                    student_id=student.id,
                    enrollment_date=date.today(),
                    status=EnrollmentStatus.ACTIVE
                )
                db.add(enrollment)

    # Assign initial fee plan if requested
    if payload.initial_fee_plan_id:
        fee_plan = db.query(FeePlan).filter(
            FeePlan.id == payload.initial_fee_plan_id,
            FeePlan.institute_id == admin.institute_id
        ).first()
        if fee_plan:
            discount = payload.discount_amount or 0.0
            net = max(0.0, float(fee_plan.total_amount) - discount)
            fee_assign = StudentFeeAssignment(
                institute_id=admin.institute_id,
                student_id=student.id,
                fee_plan_id=fee_plan.id,
                total_amount=fee_plan.total_amount,
                discount_amount=discount,
                net_amount=net,
                status=FeeStatus.PENDING
            )
            db.add(fee_assign)
            db.flush()

            # Create installments
            num_inst = fee_plan.installments_count or 1
            inst_amount = round(net / num_inst, 2)
            for i in range(num_inst):
                due = date.today() + timedelta(days=30 * (i + 1))
                installment = FeeInstallment(
                    student_fee_assignment_id=fee_assign.id,
                    installment_number=i + 1,
                    due_date=due,
                    amount=inst_amount,
                    paid_amount=0.0,
                    status=FeeStatus.PENDING
                )
                db.add(installment)

    # Audit log
    audit = AuditLog(
        institute_id=admin.institute_id,
        user_id=admin.id,
        action="STUDENT_CREATED",
        entity_type="Student",
        entity_id=student.id,
        details={"student_code": student.student_id_code, "name": f"{payload.first_name} {payload.last_name}"}
    )
    db.add(audit)
    db.commit()
    db.refresh(student)

    return ApiResponse(
        data=serialize_student(student, db),
        message="Student registered successfully and invitation created"
    )


@router.get("/{id}", response_model=ApiResponse[StudentResponse])
def get_student_details(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == id,
        Student.institute_id == current_user.institute_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # If student is checking, they can only view their own profile
    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to student record")

    return ApiResponse(data=serialize_student(student, db))


@router.put("/{id}", response_model=ApiResponse[StudentResponse])
def update_student(
    id: str,
    payload: StudentUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == id,
        Student.institute_id == admin.institute_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if payload.first_name or payload.last_name or payload.phone or payload.address:
        if student.user and student.user.profile:
            if payload.first_name:
                student.user.profile.first_name = payload.first_name
            if payload.last_name:
                student.user.profile.last_name = payload.last_name
            if payload.phone:
                student.user.profile.phone = payload.phone
            if payload.address:
                student.user.profile.address = payload.address

    if payload.grade_level is not None:
        student.grade_level = payload.grade_level
    if payload.guardian_name is not None:
        student.guardian_name = payload.guardian_name
    if payload.guardian_phone is not None:
        student.guardian_phone = payload.guardian_phone
    if payload.guardian_email is not None:
        student.guardian_email = payload.guardian_email
    if payload.guardian_relation is not None:
        student.guardian_relation = payload.guardian_relation
    if payload.medical_info is not None:
        student.medical_info = payload.medical_info
    if payload.remarks is not None:
        student.remarks = payload.remarks
    if payload.status is not None:
        student.status = payload.status

    db.commit()
    db.refresh(student)

    return ApiResponse(data=serialize_student(student, db), message="Student details updated")


@router.patch("/{id}/status", response_model=ApiResponse[dict])
def update_student_status(
    id: str,
    status: StudentStatus,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == id,
        Student.institute_id == admin.institute_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.status = status
    if status == StudentStatus.SUSPENDED:
        if student.user:
            student.user.is_active = False
    elif status == StudentStatus.ACTIVE:
        if student.user:
            student.user.is_active = True

    db.commit()
    return ApiResponse(data={"status": status.value}, message=f"Student status updated to {status.value}")


@router.post("/import-csv", response_model=ApiResponse[dict])
async def import_students_csv(
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    created_count = 0
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        email = row.get("email", "").strip()
        first_name = row.get("first_name", "").strip()
        last_name = row.get("last_name", "").strip()

        if not email or not first_name or not last_name:
            errors.append(f"Row {row_idx}: Missing required fields (email, first_name, last_name)")
            continue

        existing = db.query(User).filter(User.email == email.lower()).first()
        if existing:
            errors.append(f"Row {row_idx}: User with email {email} already exists")
            continue

        user = User(
            institute_id=admin.institute_id,
            email=email.lower(),
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=False,
            invitation_token=generate_random_token(40),
            hashed_password=get_password_hash("Student@123")
        )
        db.add(user)
        db.flush()

        profile = UserProfile(
            user_id=user.id,
            first_name=first_name,
            last_name=last_name,
            phone=row.get("phone", "").strip()
        )
        db.add(profile)
        db.flush()

        student = Student(
            user_id=user.id,
            institute_id=admin.institute_id,
            student_id_code=generate_student_code(db, admin.institute_id),
            admission_date=date.today(),
            grade_level=row.get("grade_level", "").strip(),
            guardian_name=row.get("guardian_name", "").strip(),
            guardian_phone=row.get("guardian_phone", "").strip()
        )
        db.add(student)
        created_count += 1

    db.commit()
    return ApiResponse(
        data={"imported_count": created_count, "errors": errors},
        message=f"Successfully imported {created_count} students. {len(errors)} issues encountered."
    )
