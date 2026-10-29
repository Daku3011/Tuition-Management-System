from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Batch, Subject, BatchEnrollment, EnrollmentStatus
from app.models.examination import Examinations, ExamSubject, ExamResult, ExamStatus
from app.models.communication import AuditLog
from app.schemas.examination import (
    ExaminationCreate,
    ExaminationResponse,
    ExamSubjectResponse,
    BatchResultSubmit,
    ExamResultResponse,
)
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_admin, require_staff

router = APIRouter()


def serialize_exam(exam: Examinations) -> ExaminationResponse:
    batch_name = exam.batch.name if exam.batch else ""
    subject_items = []
    for es in exam.exam_subjects:
        subject_items.append(
            ExamSubjectResponse(
                id=es.id,
                subject_id=es.subject_id,
                subject_name=es.subject.name if es.subject else "Subject",
                exam_date=es.exam_date,
                max_marks=float(es.max_marks),
                passing_marks=float(es.passing_marks)
            )
        )

    return ExaminationResponse(
        id=exam.id,
        institute_id=exam.institute_id,
        batch_id=exam.batch_id,
        batch_name=batch_name,
        title=exam.title,
        exam_type=exam.exam_type,
        start_date=exam.start_date,
        end_date=exam.end_date,
        status=exam.status,
        subjects=subject_items
    )


def serialize_result(res: ExamResult) -> ExamResultResponse:
    st_name = (
        res.student.user.profile.full_name
        if (res.student and res.student.user and res.student.user.profile)
        else "Student"
    )
    st_code = res.student.student_id_code if res.student else ""
    subj_name = res.exam_subject.subject.name if (res.exam_subject and res.exam_subject.subject) else "Subject"
    max_m = float(res.exam_subject.max_marks) if res.exam_subject else 100.0
    pass_m = float(res.exam_subject.passing_marks) if res.exam_subject else 35.0
    marks = float(res.marks_obtained)

    return ExamResultResponse(
        id=res.id,
        exam_subject_id=res.exam_subject_id,
        subject_name=subj_name,
        student_id=res.student_id,
        student_name=st_name,
        student_code=st_code,
        marks_obtained=marks,
        max_marks=max_m,
        passing_marks=pass_m,
        is_passed=marks >= pass_m,
        grade=res.grade,
        remarks=res.remarks,
        is_published=res.is_published
    )


@router.get("", response_model=ApiResponse[List[ExaminationResponse]])
def list_examinations(
    batch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Examinations).filter(Examinations.institute_id == current_user.institute_id)

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            enrolled_batch_ids = [
                e.batch_id for e in db.query(BatchEnrollment).filter(
                    BatchEnrollment.student_id == student.id,
                    BatchEnrollment.status == EnrollmentStatus.ACTIVE
                ).all()
            ]
            query = query.filter(Examinations.batch_id.in_(enrolled_batch_ids))
        else:
            return ApiResponse(data=[])

    if batch_id:
        query = query.filter(Examinations.batch_id == batch_id)

    exams = query.order_by(Examinations.start_date.desc()).all()
    return ApiResponse(data=[serialize_exam(e) for e in exams])


@router.post("", response_model=ApiResponse[ExaminationResponse])
def create_examination(
    payload: ExaminationCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    batch = db.query(Batch).filter(Batch.id == payload.batch_id, Batch.institute_id == admin.institute_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    exam = Examinations(
        institute_id=admin.institute_id,
        batch_id=payload.batch_id,
        title=payload.title,
        exam_type=payload.exam_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=ExamStatus.DRAFT
    )
    db.add(exam)
    db.flush()

    for item in payload.subjects:
        es = ExamSubject(
            examination_id=exam.id,
            subject_id=item.subject_id,
            exam_date=item.exam_date,
            max_marks=item.max_marks,
            passing_marks=item.passing_marks
        )
        db.add(es)

    db.commit()
    db.refresh(exam)

    return ApiResponse(data=serialize_exam(exam), message="Examination schedule created")


@router.post("/results/batch-entry", response_model=ApiResponse[dict])
def record_exam_marks(
    payload: BatchResultSubmit,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    exam_subject = db.query(ExamSubject).filter(ExamSubject.id == payload.exam_subject_id).first()
    if not exam_subject:
        raise HTTPException(status_code=404, detail="Exam subject not found")

    max_marks = float(exam_subject.max_marks)

    for entry in payload.results:
        if entry.marks_obtained > max_marks or entry.marks_obtained < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Marks {entry.marks_obtained} cannot exceed maximum marks {max_marks}"
            )

        # Grade calculation
        pct = (entry.marks_obtained / max_marks) * 100
        grade = "A+" if pct >= 90 else "A" if pct >= 80 else "B" if pct >= 65 else "C" if pct >= 50 else "D" if pct >= 35 else "F"

        existing = db.query(ExamResult).filter(
            ExamResult.exam_subject_id == exam_subject.id,
            ExamResult.student_id == entry.student_id
        ).first()

        if existing:
            existing.marks_obtained = entry.marks_obtained
            existing.grade = entry.grade or grade
            existing.remarks = entry.remarks
            existing.entered_by_user_id = current_user.id
        else:
            result = ExamResult(
                exam_subject_id=exam_subject.id,
                student_id=entry.student_id,
                marks_obtained=entry.marks_obtained,
                grade=entry.grade or grade,
                remarks=entry.remarks,
                is_published=False,
                entered_by_user_id=current_user.id
            )
            db.add(result)

    db.commit()
    return ApiResponse(data={"count": len(payload.results)}, message="Marks recorded successfully")


@router.post("/{id}/publish", response_model=ApiResponse[dict])
def publish_exam_results(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    exam = db.query(Examinations).filter(Examinations.id == id, Examinations.institute_id == admin.institute_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found")

    exam.status = ExamStatus.PUBLISHED

    # Publish all student results for this examination
    subject_ids = [es.id for es in exam.exam_subjects]
    results = db.query(ExamResult).filter(ExamResult.exam_subject_id.in_(subject_ids)).all()
    for r in results:
        r.is_published = True

    audit = AuditLog(
        institute_id=admin.institute_id,
        user_id=admin.id,
        action="EXAM_RESULTS_PUBLISHED",
        entity_type="Examinations",
        entity_id=exam.id,
        details={"title": exam.title, "results_count": len(results)}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(data={"published_count": len(results)}, message="Examination results published to students")


@router.get("/student/{student_id}", response_model=ApiResponse[List[ExamResultResponse]])
def get_student_results(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.institute_id == current_user.institute_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    query = db.query(ExamResult).filter(ExamResult.student_id == student.id)

    # If student is viewing, only show published results
    if current_user.role == UserRole.STUDENT:
        if student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        query = query.filter(ExamResult.is_published == True)

    results = query.all()
    return ApiResponse(data=[serialize_result(r) for r in results])
