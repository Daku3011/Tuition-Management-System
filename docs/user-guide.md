# Tuition Management System (TMS) User Guide
## Operational Manual for Administrators, Faculty & Students

### 1. Administration Workflows

#### 1.1 Initial Setup & Institute Configuration
1. Log in via `/login/admin` using the provisioned administrator credentials.
2. Review the **Institute Settings** (`/admin/settings`):
   - Set Institute Name, Code, Address, Currency (default: INR ₹), and Academic Year.
3. Establish your **Courses & Subjects** (`/admin/courses`):
   - Add courses (e.g., "Grade 10 CBSE", "JEE Advanced Foundation").
   - Define subjects under each course (e.g., Mathematics, Physics, Chemistry).
4. Create **Batches** (`/admin/batches`):
   - Set batch capacity, classroom number, schedule days, and assigned lead faculty.

#### 1.2 Onboarding Students & Faculty
1. **Adding Students** (`/admin/students`):
   - Click **Add Student** or use **Import CSV** for bulk enrollment.
   - Enter student personal details, guardian contact, and assigned batch.
   - Click **Send Invitation**: The student receives a secure invitation link to create their password.
2. **Onboarding Faculty** (`/admin/faculty`):
   - Register faculty member, assign specialization and subjects.
   - Send onboarding invite.

#### 1.3 Fee Structures & Collection
1. **Fee Plans** (`/admin/fees`):
   - Define tuition fee plan (e.g., Annual Tuition ₹60,000 in 3 installments).
   - Assign plan to student with optional scholarship/discount.
2. **Recording Payments**:
   - Navigate to **Payments** -> **Record Payment**.
   - Select student and installment, choose payment mode (Cash, Bank Transfer, UPI).
   - Instant PDF fee receipt with unique receipt number is automatically generated.

---

### 2. Faculty Workflows

#### 2.1 Daily Attendance
1. Access the **Faculty Portal** (`/faculty/dashboard`).
2. Select your scheduled batch for today under **Mark Attendance**.
3. View enrolled roster; click status badges (`Present`, `Absent`, `Late`, `Excused`) or use `Mark All Present`.
4. Enter class summary/topic covered and click **Submit Attendance**.
5. Once submitted, changes require recording an audit reason.

#### 2.2 Homework & Materials
1. Go to **Homework** (`/faculty/homework`).
2. Click **Create Assignment**, enter title, description, max marks, and due date.
3. Review submissions as students upload their work; enter marks and feedback.

#### 2.3 Examinations & Marks
1. Go to **Examinations** (`/faculty/examinations`).
2. Enter student scores against maximum marks. Submit to Admin for final publication.

---

### 3. Student Workflows

#### 3.1 Account Activation & Login
1. Open the activation link from email.
2. Enter a strong password and sign in to the **Student Portal** (`/student/dashboard`).

#### 3.2 Accessing Academics
- **Timetable**: View today's classes, room details, and instructor information.
- **Attendance**: Track subject-wise attendance percentage with automated low-attendance warnings.
- **Homework**: Download assignments, upload completed work, and view teacher feedback and grades.
- **Results**: Access published report cards and exam performance.
- **Fees**: View pending installments, transaction history, and download official receipts.

---

### 4. Expo Mobile App Usage
- Students and Faculty log in through the unified mobile screen.
- The mobile application automatically identifies the user role and renders:
  - **Student View**: Timetable, Homework Submissions, Attendance Tracker, Fee Status.
  - **Faculty View**: Today's Schedule, Quick Attendance Punch, Assignment Grading.
- Session tokens are stored securely in device hardware via `Expo SecureStore`.
