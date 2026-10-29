import random
from datetime import date, datetime, timedelta, time, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.base import utc_now
from app.models.institute import Institute
from app.models.user import User, UserProfile, UserRole
from app.models.student import Student, StudentStatus
from app.models.faculty import Faculty, FacultyStatus
from app.models.academic import (
    AcademicYear,
    Course,
    Subject,
    Batch,
    BatchStatus,
    BatchFaculty,
    BatchEnrollment,
    EnrollmentStatus,
    ClassSession,
)
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceStatus
from app.models.homework import Assignment, AssignmentSubmission, SubmissionStatus, StudyMaterial
from app.models.examination import Examinations, ExamSubject, ExamResult, ExamStatus
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
from app.models.communication import Announcement, AudienceType, Notification, AuditLog


def run_seed():
    print("🌱 Seeding database with comprehensive realistic records...")
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        existing_inst = db.query(Institute).first()
        if existing_inst:
            print(f"Database already contains institute: {existing_inst.name}. Skipping seed.")
            return

        # 1. Primary Institute
        institute = Institute(
            name="Apex Academy of Science & Mathematics",
            code="APEX-ACADEMY",
            address="Plot 42, Knowledge Corridor, Near University Circle, Ahmedabad, Gujarat 380015",
            contact_email="admin@apexacademy.com",
            contact_phone="+91 98250 12345",
            currency="INR",
            timezone="Asia/Kolkata",
            settings={
                "attendance_threshold_warning": 75.0,
                "late_fee_per_day": 50,
                "allow_student_resubmission": True
            }
        )
        db.add(institute)
        db.flush()

        # 2. Academic Year
        acad_year = AcademicYear(
            institute_id=institute.id,
            name="Academic Year 2026-2027",
            start_date=date(2026, 4, 1),
            end_date=date(2027, 3, 31),
            is_current=True
        )
        db.add(acad_year)
        db.flush()

        # 3. Administrator
        admin_user = User(
            institute_id=institute.id,
            email="admin@apexacademy.com",
            hashed_password=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            last_login_at=utc_now()
        )
        db.add(admin_user)
        db.flush()

        admin_profile = UserProfile(
            user_id=admin_user.id,
            first_name="Vikram",
            last_name="Singhania",
            phone="+91 98250 11111",
            address="Skyline Towers, Ahmedabad"
        )
        db.add(admin_profile)

        # 4. Faculty Members
        fac_data = [
            {
                "email": "prof.sharma@apexacademy.com",
                "first_name": "Rajesh",
                "last_name": "Sharma",
                "phone": "+91 98250 22222",
                "code": "FAC-2026-001",
                "designation": "Head of Mathematics & Physics",
                "qualification": "M.Sc. Physics (IIT Bombay), B.Ed.",
                "specialization": "Calculus, Mechanics, Quantum Theory",
                "bio": "15+ years experience mentoring Olympiad & Board toppers."
            },
            {
                "email": "dr.patel@apexacademy.com",
                "first_name": "Ananya",
                "last_name": "Patel",
                "phone": "+91 98250 33333",
                "code": "FAC-2026-002",
                "designation": "Senior Lecturer in Chemistry",
                "qualification": "Ph.D. Chemistry (IISc Bangalore)",
                "specialization": "Organic Chemistry & Chemical Kinetics",
                "bio": "Published author and premier coach for competitive chemistry."
            }
        ]

        faculty_records = []
        for fd in fac_data:
            user = User(
                institute_id=institute.id,
                email=fd["email"],
                hashed_password=get_password_hash("Faculty@123"),
                role=UserRole.FACULTY,
                is_active=True,
                is_verified=True,
                last_login_at=utc_now()
            )
            db.add(user)
            db.flush()

            profile = UserProfile(
                user_id=user.id,
                first_name=fd["first_name"],
                last_name=fd["last_name"],
                phone=fd["phone"]
            )
            db.add(profile)
            db.flush()

            fac = Faculty(
                user_id=user.id,
                institute_id=institute.id,
                faculty_code=fd["code"],
                designation=fd["designation"],
                qualification=fd["qualification"],
                specialization=fd["specialization"],
                joining_date=date(2024, 6, 1),
                status=FacultyStatus.ACTIVE,
                bio=fd["bio"]
            )
            db.add(fac)
            db.flush()
            faculty_records.append(fac)

        # 5. Courses & Subjects
        course_10 = Course(
            institute_id=institute.id,
            name="Class 10 CBSE Board & Olympiad Foundation",
            code="CBSE-10-FOUN",
            description="Intensive year-long curriculum covering Board syllabus, NTSE and Junior Science Olympiad."
        )
        course_12 = Course(
            institute_id=institute.id,
            name="Class 12 JEE Advanced & Board Masterclass",
            code="JEE-12-MAST",
            description="Comprehensive preparation for JEE Advanced, JEE Main, and Class 12 Boards."
        )
        db.add_all([course_10, course_12])
        db.flush()

        subj_math10 = Subject(course_id=course_10.id, name="Advanced Mathematics", code="MATH-10")
        subj_phy10 = Subject(course_id=course_10.id, name="Conceptual Physics", code="PHY-10")
        subj_chem10 = Subject(course_id=course_10.id, name="Inorganic & Organic Chemistry", code="CHEM-10")

        subj_phy12 = Subject(course_id=course_12.id, name="Advanced Physics (Mechanics & Electromagnetism)", code="PHY-12")
        subj_chem12 = Subject(course_id=course_12.id, name="Physical & Organic Chemistry", code="CHEM-12")

        db.add_all([subj_math10, subj_phy10, subj_chem10, subj_phy12, subj_chem12])
        db.flush()

        # 6. Batches
        batch_10 = Batch(
            institute_id=institute.id,
            course_id=course_10.id,
            academic_year_id=acad_year.id,
            name="Batch 10-Alpha (Morning)",
            code="B10-ALPHA",
            capacity=25,
            start_date=date(2026, 4, 15),
            end_date=date(2027, 2, 28),
            room_number="Lecture Hall 101",
            meeting_link="https://meet.google.com/apex-b10-alpha",
            status=BatchStatus.ONGOING
        )
        batch_12 = Batch(
            institute_id=institute.id,
            course_id=course_12.id,
            academic_year_id=acad_year.id,
            name="Batch 12-Pinnacle (Evening)",
            code="B12-PINN",
            capacity=30,
            start_date=date(2026, 4, 10),
            end_date=date(2027, 3, 15),
            room_number="Seminar Room 204",
            meeting_link="https://meet.google.com/apex-b12-pinn",
            status=BatchStatus.ONGOING
        )
        db.add_all([batch_10, batch_12])
        db.flush()

        # Assign Faculty to Batches
        bf1 = BatchFaculty(batch_id=batch_10.id, faculty_id=faculty_records[0].id, subject_id=subj_math10.id, role="Lead Instructor")
        bf2 = BatchFaculty(batch_id=batch_10.id, faculty_id=faculty_records[0].id, subject_id=subj_phy10.id, role="Lead Instructor")
        bf3 = BatchFaculty(batch_id=batch_10.id, faculty_id=faculty_records[1].id, subject_id=subj_chem10.id, role="Lead Instructor")
        bf4 = BatchFaculty(batch_id=batch_12.id, faculty_id=faculty_records[0].id, subject_id=subj_phy12.id, role="Lead Instructor")
        bf5 = BatchFaculty(batch_id=batch_12.id, faculty_id=faculty_records[1].id, subject_id=subj_chem12.id, role="Lead Instructor")
        db.add_all([bf1, bf2, bf3, bf4, bf5])
        db.flush()

        # Timetable Class Sessions (Monday = 0, Wednesday = 2, Friday = 4)
        cs1 = ClassSession(
            institute_id=institute.id,
            batch_id=batch_10.id,
            subject_id=subj_math10.id,
            faculty_id=faculty_records[0].id,
            day_of_week=0,
            start_time=time(8, 0),
            end_time=time(9, 30),
            room_or_link="Lecture Hall 101",
            topic_summary="Quadratic Equations & Arithmetic Progressions"
        )
        cs2 = ClassSession(
            institute_id=institute.id,
            batch_id=batch_10.id,
            subject_id=subj_phy10.id,
            faculty_id=faculty_records[0].id,
            day_of_week=2,
            start_time=time(8, 0),
            end_time=time(9, 30),
            room_or_link="Lecture Hall 101",
            topic_summary="Light: Reflection & Refraction"
        )
        cs3 = ClassSession(
            institute_id=institute.id,
            batch_id=batch_10.id,
            subject_id=subj_chem10.id,
            faculty_id=faculty_records[1].id,
            day_of_week=4,
            start_time=time(8, 0),
            end_time=time(9, 30),
            room_or_link="Lecture Hall 101",
            topic_summary="Chemical Reactions & Equations"
        )
        db.add_all([cs1, cs2, cs3])
        db.flush()

        # 7. Fee Plans
        plan_10 = FeePlan(
            institute_id=institute.id,
            course_id=course_10.id,
            name="Class 10 Annual Comprehensive Plan",
            description="Includes study kits, 50+ mock tests, laboratory sessions, and board prep.",
            total_amount=45000.00,
            currency="INR",
            installments_count=3
        )
        plan_12 = FeePlan(
            institute_id=institute.id,
            course_id=course_12.id,
            name="Class 12 JEE Advanced 2-Term Plan",
            description="Full JEE Advanced curriculum, all-India test series, and personalized mentoring.",
            total_amount=60000.00,
            currency="INR",
            installments_count=3
        )
        db.add_all([plan_10, plan_12])
        db.flush()

        # 8. Students
        students_info = [
            ("Aarav", "Patel", "aarav.patel@student.com", "STU-2026-0001", "Grade 10", "Dinesh Patel", "+91 98250 44001"),
            ("Diya", "Shah", "diya.shah@student.com", "STU-2026-0002", "Grade 10", "Mukesh Shah", "+91 98250 44002"),
            ("Rohan", "Mehta", "rohan.mehta@student.com", "STU-2026-0003", "Grade 10", "Bhavin Mehta", "+91 98250 44003"),
            ("Ishita", "Desai", "ishita.desai@student.com", "STU-2026-0004", "Grade 10", "Nitin Desai", "+91 98250 44004"),
            ("Kabir", "Joshi", "kabir.joshi@student.com", "STU-2026-0005", "Grade 10", "Sanjay Joshi", "+91 98250 44005"),
            ("Ananya", "Verma", "ananya.verma@student.com", "STU-2026-0006", "Grade 12", "Alok Verma", "+91 98250 44006"),
            ("Dev", "Trivedi", "dev.trivedi@student.com", "STU-2026-0007", "Grade 12", "Kamlesh Trivedi", "+91 98250 44007"),
            ("Priya", "Nair", "priya.nair@student.com", "STU-2026-0008", "Grade 12", "Ramesh Nair", "+91 98250 44008"),
            ("Vivaan", "Chauhan", "vivaan.chauhan@student.com", "STU-2026-0009", "Grade 12", "Pravin Chauhan", "+91 98250 44009"),
            ("Sara", "Kapoor", "sara.kapoor@student.com", "STU-2026-0010", "Grade 12", "Sunil Kapoor", "+91 98250 44010"),
        ]

        student_records = []
        for idx, s in enumerate(students_info):
            user = User(
                institute_id=institute.id,
                email=s[2],
                hashed_password=get_password_hash("Student@123"),
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True,
                last_login_at=utc_now()
            )
            db.add(user)
            db.flush()

            profile = UserProfile(
                user_id=user.id,
                first_name=s[0],
                last_name=s[1],
                phone=s[6],
                address="Ahmedabad, Gujarat"
            )
            db.add(profile)
            db.flush()

            student = Student(
                user_id=user.id,
                institute_id=institute.id,
                student_id_code=s[3],
                admission_date=date(2026, 4, 15),
                status=StudentStatus.ACTIVE,
                grade_level=s[4],
                guardian_name=s[5],
                guardian_phone=s[6],
                guardian_relation="Father"
            )
            db.add(student)
            db.flush()
            student_records.append(student)

            # Enroll in batch
            target_batch = batch_10 if idx < 5 else batch_12
            enrollment = BatchEnrollment(
                batch_id=target_batch.id,
                student_id=student.id,
                enrollment_date=date(2026, 4, 15),
                status=EnrollmentStatus.ACTIVE,
                roll_number=f"ROLL-{idx + 1:02d}"
            )
            db.add(enrollment)

            # Assign fee plan & installments
            target_plan = plan_10 if idx < 5 else plan_12
            discount = 5000.00 if idx in [0, 5] else 0.00  # Scholarship for top 2
            net = float(target_plan.total_amount) - discount
            fee_assign = StudentFeeAssignment(
                institute_id=institute.id,
                student_id=student.id,
                fee_plan_id=target_plan.id,
                total_amount=target_plan.total_amount,
                discount_amount=discount,
                discount_reason="Academic Merit Scholarship" if discount > 0 else None,
                net_amount=net,
                status=FeeStatus.PARTIAL if idx < 7 else FeeStatus.PENDING
            )
            db.add(fee_assign)
            db.flush()

            inst_amt = round(net / 3, 2)
            for i in range(3):
                inst_due = date(2026, 5, 1) + timedelta(days=60 * i)
                is_paid = (i == 0 and idx < 7) or (i == 1 and idx < 3)
                paid_val = inst_amt if is_paid else 0.00
                st = FeeStatus.PAID if is_paid else (FeeStatus.OVERDUE if inst_due < date.today() else FeeStatus.PENDING)

                installment = FeeInstallment(
                    student_fee_assignment_id=fee_assign.id,
                    installment_number=i + 1,
                    due_date=inst_due,
                    amount=inst_amt,
                    paid_amount=paid_val,
                    status=st
                )
                db.add(installment)
                db.flush()

                # If paid, generate Payment & Receipt record
                if is_paid:
                    pmt = Payment(
                        institute_id=institute.id,
                        student_id=student.id,
                        fee_assignment_id=fee_assign.id,
                        installment_id=installment.id,
                        amount=inst_amt,
                        currency="INR",
                        payment_method=PaymentMethod.UPI if idx % 2 == 0 else PaymentMethod.BANK_TRANSFER,
                        payment_date=datetime(2026, 5, 2, 11, 30),
                        transaction_reference=f"UPI-{random.randint(10000000, 99999999)}",
                        status=PaymentStatus.COMPLETED,
                        recorded_by_user_id=admin_user.id
                    )
                    db.add(pmt)
                    db.flush()

                    rcp = Receipt(
                        institute_id=institute.id,
                        payment_id=pmt.id,
                        receipt_number=f"RCP-2026-{1000 + idx * 3 + i:05d}",
                        receipt_date=date(2026, 5, 2)
                    )
                    db.add(rcp)

        # 9. Attendance Sessions & Records (for Batch 10 over past 5 sessions)
        for d_offset in [12, 9, 7, 5, 2]:
            s_date = date.today() - timedelta(days=d_offset)
            att_session = AttendanceSession(
                institute_id=institute.id,
                batch_id=batch_10.id,
                faculty_id=faculty_records[0].id,
                session_date=s_date,
                title=f"Maths Class - Session on {s_date}",
                topic_covered="Trigonometric Identities & Application of Derivatives",
                status="SUBMITTED"
            )
            db.add(att_session)
            db.flush()

            for s_idx, st in enumerate(student_records[:5]):
                # 90% attendance realism
                status_choice = AttendanceStatus.PRESENT if (s_idx + d_offset) % 7 != 0 else AttendanceStatus.ABSENT
                rec = AttendanceRecord(
                    attendance_session_id=att_session.id,
                    student_id=st.id,
                    status=status_choice,
                    remarks="Attentive" if status_choice == AttendanceStatus.PRESENT else "Medical leave reported",
                    recorded_by_user_id=faculty_records[0].user_id
                )
                db.add(rec)

        # 10. Homework Assignments
        hw1 = Assignment(
            institute_id=institute.id,
            batch_id=batch_10.id,
            subject_id=subj_math10.id,
            faculty_id=faculty_records[0].id,
            title="Problem Set 4: Quadratic Curves & Optimization",
            description="Solve exercises 4.1 through 4.5 from the reference booklet. Show detailed steps for full credit.",
            due_date=datetime.now(timezone.utc) + timedelta(days=4),
            max_marks=50.0,
            status="ACTIVE"
        )
        hw2 = Assignment(
            institute_id=institute.id,
            batch_id=batch_10.id,
            subject_id=subj_phy10.id,
            faculty_id=faculty_records[0].id,
            title="Lab Analysis: Snell's Law & Refractive Index",
            description="Write a 2-page report calculating refractive indices for glass slabs using ray tracing diagrams.",
            due_date=datetime.now(timezone.utc) - timedelta(days=2),
            max_marks=30.0,
            status="ACTIVE"
        )
        db.add_all([hw1, hw2])
        db.flush()

        # Submissions for hw2
        for st in student_records[:3]:
            sub = AssignmentSubmission(
                assignment_id=hw2.id,
                student_id=st.id,
                submission_date=datetime.now(timezone.utc) - timedelta(days=3),
                content="Attached completed lab report diagrams and calculation sheet.",
                status=SubmissionStatus.REVIEWED,
                marks_obtained=27.5,
                feedback="Excellent derivation and clear ray diagrams.",
                reviewed_by_user_id=faculty_records[0].user_id,
                reviewed_at=utc_now()
            )
            db.add(sub)

        # 11. Study Materials
        mat1 = StudyMaterial(
            institute_id=institute.id,
            batch_id=batch_10.id,
            subject_id=subj_math10.id,
            faculty_id=faculty_records[0].id,
            title="Comprehensive Formula Sheet: Algebra & Coordinate Geometry",
            description="Master reference sheet containing all theorems, proofs, and shortcuts.",
            file_url="https://documents.apexacademy.com/math10-formula-sheet.pdf",
            file_type="application/pdf",
            file_size_bytes=2450000
        )
        db.add(mat1)

        # 12. Examination & Results
        exam = Examinations(
            institute_id=institute.id,
            batch_id=batch_10.id,
            title="Mid-Term Assessment 2026",
            exam_type="Term Exam",
            start_date=date(2026, 9, 10),
            end_date=date(2026, 9, 20),
            status=ExamStatus.PUBLISHED
        )
        db.add(exam)
        db.flush()

        es_math = ExamSubject(
            examination_id=exam.id,
            subject_id=subj_math10.id,
            exam_date=date(2026, 9, 12),
            max_marks=100.0,
            passing_marks=40.0
        )
        es_phy = ExamSubject(
            examination_id=exam.id,
            subject_id=subj_phy10.id,
            exam_date=date(2026, 9, 15),
            max_marks=100.0,
            passing_marks=40.0
        )
        db.add_all([es_math, es_phy])
        db.flush()

        scores = [94.0, 88.5, 91.0, 76.0, 84.5]
        for idx, st in enumerate(student_records[:5]):
            res = ExamResult(
                exam_subject_id=es_math.id,
                student_id=st.id,
                marks_obtained=scores[idx],
                grade="A+" if scores[idx] >= 90 else "A",
                remarks="Outstanding performance in problem-solving.",
                is_published=True,
                entered_by_user_id=faculty_records[0].user_id
            )
            db.add(res)

        # 13. Announcements
        ann1 = Announcement(
            institute_id=institute.id,
            title="Diwali Vacation & Special Doubt Solving Clinics",
            content="The institute will observe Diwali holidays from Nov 8 to Nov 15. Special online doubt clearing sessions will be held on Nov 11.",
            target_audience=AudienceType.ALL,
            priority="HIGH",
            published_at=utc_now()
        )
        ann2 = Announcement(
            institute_id=institute.id,
            title="National Science Olympiad Registration Open",
            content="All Class 10 students are encouraged to register with Prof. Rajesh Sharma before Friday.",
            target_audience=AudienceType.STUDENTS,
            priority="NORMAL",
            published_at=utc_now()
        )
        db.add_all([ann1, ann2])

        # 14. Notifications for Students & Faculty
        for st in student_records[:3]:
            notif = Notification(
                institute_id=institute.id,
                user_id=st.user_id,
                title="Homework Graded: Snell's Law",
                message="Prof. Rajesh Sharma has reviewed your lab analysis. You scored 27.5 / 30.",
                link="/student/homework",
                notification_type="ACADEMIC"
            )
            db.add(notif)

        db.commit()
        print("✅ Database seeding completed successfully!")
        print("\nTest User Accounts Provisioned:")
        print("----------------------------------------------------------------------")
        print("Role    | Email                         | Password")
        print("----------------------------------------------------------------------")
        print("ADMIN   | admin@apexacademy.com         | Admin@123")
        print("FACULTY | prof.sharma@apexacademy.com   | Faculty@123")
        print("FACULTY | dr.patel@apexacademy.com      | Faculty@123")
        print("STUDENT | aarav.patel@student.com       | Student@123")
        print("STUDENT | diya.shah@student.com         | Student@123")
        print("STUDENT | rohan.mehta@student.com       | Student@123")
        print("----------------------------------------------------------------------\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding error: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
