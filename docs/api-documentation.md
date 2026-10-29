# API Specifications & Endpoint Contracts
## FastAPI v1 OpenAPI Architecture

Base URL: `/api/v1`

All responses follow a consistent envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```
Errors adhere to standard RFC error format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid credentials provided",
    "details": []
  }
}
```

---

### 1. Authentication & Security Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/login` | Email/Password login, returns JWT access token + user profile | None |
| `POST` | `/auth/refresh` | Exchange refresh token for new access token | Refresh Token |
| `POST` | `/auth/logout` | Revoke session / clear auth state | Bearer JWT |
| `POST` | `/auth/invite` | Admin invites new student/faculty via email token | Admin / Super Admin |
| `POST` | `/auth/accept-invitation` | Set password using invitation token | None |
| `POST` | `/auth/forgot-password` | Generate password reset token | None |
| `POST` | `/auth/reset-password` | Complete password reset | None |
| `GET` | `/auth/me` | Fetch authenticated user context, roles, and profile | Bearer JWT |

---

### 2. Student Management (`/api/v1/students`)

| Method | Endpoint | Description | RBAC |
|---|---|---|---|
| `GET` | `/students` | Paginated, filtered list of students with batch information | Admin, Faculty |
| `POST` | `/students` | Register student, create profile, allocate student ID, invite | Admin |
| `GET` | `/students/{id}` | Complete 360-degree student profile | Admin, Faculty, Self |
| `PUT` | `/students/{id}` | Update student details (contact, emergency, guardian) | Admin |
| `PATCH` | `/students/{id}/status` | Activate, suspend, or archive student | Admin |
| `POST` | `/students/import-csv` | Validated CSV batch ingestion with preview & error report | Admin |

---

### 3. Faculty Management (`/api/v1/faculty`)

| Method | Endpoint | Description | RBAC |
|---|---|---|---|
| `GET` | `/faculty` | List faculty with assigned subjects, batches, and load | Admin |
| `POST` | `/faculty` | Onboard faculty member and dispatch invitation | Admin |
| `GET` | `/faculty/{id}` | Detailed faculty profile, assigned batches & timetable | Admin, Faculty Self |
| `PUT` | `/faculty/{id}` | Update faculty profile & teaching assignments | Admin |
| `GET` | `/faculty/me/classes` | Fetch currently assigned batches and classes for logged-in faculty | Faculty |

---

### 4. Academic & Timetable (`/api/v1/courses`, `/batches`, `/timetable`)

| Method | Endpoint | Description | RBAC |
|---|---|---|---|
| `GET` | `/courses` | Retrieve courses and subject syllabi | All |
| `POST` | `/courses` | Create new course definition | Admin |
| `GET` | `/batches` | List batches with capacity, enrollment counts & faculty | Admin, Faculty |
| `POST` | `/batches` | Create batch cohort | Admin |
| `POST` | `/batches/{id}/enroll` | Enroll student into batch with capacity checks | Admin |
| `GET` | `/timetable` | Filtered schedule by date range, batch_id, or faculty_id | All Authenticated |
| `POST` | `/timetable` | Schedule single or recurring class sessions | Admin |

---

### 5. Attendance Operations (`/api/v1/attendance`)

| Method | Endpoint | Description | RBAC |
|---|---|---|---|
| `POST` | `/attendance/sessions` | Create or fetch roll-call session for a batch/class | Faculty, Admin |
| `POST` | `/attendance/records` | Batch submit student attendance (Present, Absent, Late, Excused) | Faculty, Admin |
| `GET` | `/attendance/batch/{batch_id}` | Retrieve historical batch attendance metrics | Faculty, Admin |
| `GET` | `/attendance/student/{student_id}` | Retrieve individual student attendance timeline | Admin, Faculty, Student Self |
| `PATCH` | `/attendance/records/{id}/correct`| Correct attendance status with mandatory audit reason | Admin, Faculty |

---

### 6. Homework & Materials (`/api/v1/assignments`, `/study-materials`)

| Method | Endpoint | Description | RBAC |
|---|---|---|---|
| `GET` | `/assignments` | List assignments filtered by batch | All |
| `POST` | `/assignments` | Publish new homework assignment with attachments | Faculty, Admin |
| `POST` | `/assignments/{id}/submit` | Upload student homework submission | Student |
| `GET` | `/assignments/{id}/submissions` | View cohort submissions with grading status | Faculty, Admin |
| `POST` | `/submissions/{id}/review` | Grade homework submission and provide feedback | Faculty, Admin |
| `GET` | `/study-materials` | Search repository of uploaded study notes | All Authenticated |
| `POST` | `/study-materials` | Upload new lecture study material | Faculty, Admin |

---

### 7. Examinations & Results (`/api/v1/examinations`, `/results`)

| Method | Endpoint | Description | RBAC |
|---|---|---|---|
| `GET` | `/examinations` | List examinations by batch and academic term | All |
| `POST` | `/examinations` | Create examination schedule | Admin |
| `POST` | `/results/batch-entry` | Input student scores with max/passing mark validation | Faculty, Admin |
| `POST` | `/examinations/{id}/publish` | Publish verified results to student portals | Admin |
| `GET` | `/results/student/{student_id}` | Fetch student scorecard (only published exams for students) | Admin, Faculty, Student Self |

---

### 8. Fees & Invoicing (`/api/v1/fees`, `/payments`, `/receipts`)

| Method | Endpoint | Description | RBAC |
|---|---|---|---|
| `GET` | `/fees/plans` | List tuition fee structures | Admin |
| `POST` | `/fees/plans` | Create course/batch fee plan | Admin |
| `POST` | `/fees/assign` | Allocate fee plan to student with custom discounts | Admin |
| `GET` | `/fees/student/{student_id}` | Fetch ledger: total, paid, overdue installments | Admin, Student Self |
| `POST` | `/payments` | Record offline or online payment with atomic receipt creation | Admin |
| `GET` | `/receipts/{id}/pdf` | Generate & download PDF fee receipt with unique receipt number | Admin, Student Self |

---

### 9. Communications, Reports & System (`/api/v1/...`)

| Method | Endpoint | Description | RBAC |
|---|---|---|---|
| `GET` | `/announcements` | Retrieve audience-targeted announcements | All Authenticated |
| `POST` | `/announcements` | Publish institute or batch announcement | Admin, Faculty |
| `GET` | `/notifications` | List user in-app notifications with unread badge | All Authenticated |
| `PATCH` | `/notifications/{id}/read` | Mark notification as read | All Authenticated |
| `GET` | `/reports/dashboard-stats` | Real-time computed metrics for admin dashboard | Admin |
| `GET` | `/reports/attendance-export` | Export CSV attendance reports | Admin |
| `GET` | `/reports/fee-collection-export`| Export CSV fee reconciliation reports | Admin |
| `GET` | `/audit-logs` | Immutable audit log trail with actor & diff | Super Admin, Admin |
| `GET` | `/health` | Liveness health check | Public |
| `GET` | `/ready` | Readiness check verifying database connectivity | Public |
