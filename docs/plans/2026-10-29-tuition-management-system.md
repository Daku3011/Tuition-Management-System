# Tuition Management System Implementation Plan

> **Goal:** Build and test a complete, production-ready Tuition Management System (TMS) monorepo with FastAPI backend, Next.js web application (Admin, Faculty, Student portals), and Expo React Native mobile app.

**Architecture:** Monorepo with FastAPI REST backend (SQLAlchemy 2.0, Alembic, Pydantic v2), Supabase PostgreSQL database, Next.js App Router with Tailwind CSS & shadcn/ui, and Expo React Native mobile app with Expo Router.

**Tech Stack:** Python 3.10+, FastAPI, SQLAlchemy, Alembic, PostgreSQL/SQLite, Next.js 15, TypeScript, Tailwind CSS, Lucide React, TanStack Query, Recharts, React Native, Expo.

---

### Phase 1: Requirements & Architecture [COMPLETED]
- [x] Defined monorepo structure and packages.
- [x] Created architecture documentation (`docs/architecture.md`).
- [x] Created normalized database schema specification (`docs/database-schema.md`).
- [x] Created OpenAPI endpoint specification (`docs/api-documentation.md`).
- [x] Created deployment guide (`docs/deployment.md`) and user operational manual (`docs/user-guide.md`).

---

### Phase 2: Backend Architecture & Database Core
- [ ] Task 2.1: Python environment, dependencies (`requirements.txt`), Dockerfile, and configuration (`app/core/config.py`).
- [ ] Task 2.2: Database setup (`app/core/database.py`), SQLAlchemy models for all entities (Institutes, Users, Students, Faculty, Courses, Batches, Attendance, Assignments, Exams, Fees, Receipts, Announcements, Audit).
- [ ] Task 2.3: Security, Password Hashing (Bcrypt/Passlib), JWT token issuance/validation, and RBAC dependencies.
- [ ] Task 2.4: Alembic migrations configuration and initialization script.
- [ ] Task 2.5: Seed data generator (`seed.py`) with realistic institute, admin, faculty, and student records for development.

---

### Phase 3: Backend API Endpoints & Business Logic
- [ ] Task 3.1: Auth routes (`/api/v1/auth/*`) - login, me, invitations, password reset.
- [ ] Task 3.2: Students & Faculty routes (`/api/v1/students/*`, `/api/v1/faculty/*`) with CSV import & profile management.
- [ ] Task 3.3: Academic routes: Courses, Subjects, Batches, Timetable (`/api/v1/courses/*`, `/api/v1/batches/*`, `/api/v1/timetable/*`).
- [ ] Task 3.4: Attendance routes: Session creation, bulk student status, change logs with audit reasons.
- [ ] Task 3.5: Homework & Study Materials: Assignment creation, student submission, faculty grading.
- [ ] Task 3.6: Examinations & Results: Exam scheduling, marks entry, publish/unpublish.
- [ ] Task 3.7: Fees & Financials: Fee plans, student fee assignments, payment recording, auto-generated unique receipts.
- [ ] Task 3.8: Announcements, Notifications, Reports & Dashboard statistics with real-time aggregates.
- [ ] Task 3.9: Audit logging & health/readiness endpoints (`/health`, `/ready`).

---

### Phase 4: Shared Types & Web Frontend Application
- [ ] Task 4.1: Shared types package (`packages/shared-types`).
- [ ] Task 4.2: Next.js 15 Web Application setup in `apps/web` with Tailwind CSS, Lucide icons, shadcn/ui design tokens.
- [ ] Task 4.3: API Client and Auth Provider with session persistence & role redirection.
- [ ] Task 4.4: Authentication views: Login (Admin/Faculty/Student), Forgot Password, Accept Invitation.
- [ ] Task 4.5: Admin Portal: Dashboard with live metrics, Student Management, Faculty Management, Batches & Timetable, Fee Collection & Receipts, Exam Management, Announcements, Institute Settings.
- [ ] Task 4.6: Faculty Portal: Today's schedule, Attendance taking interface, Homework creator & submission grader, Marks entry.
- [ ] Task 4.7: Student Portal: Academic dashboard, Timetable, Attendance percentage tracker, Homework submission upload, Exam results, Fee ledger & receipt download.

---

### Phase 5: Expo Mobile Application
- [ ] Task 5.1: React Native / Expo application in `apps/mobile` with Expo Router and TypeScript.
- [ ] Task 5.2: Secure token storage (`Expo SecureStore`), API client integration.
- [ ] Task 5.3: Role-aware navigation: Student bottom tabs (Home, Timetable, Homework, Fees, Profile) and Faculty bottom tabs (Home, Classes, Attendance, Assignments, Profile).
- [ ] Task 5.4: Mobile workflows: Attendance marking for teachers, Homework view/submit for students, Fee summary.
- [ ] Task 5.5: EAS configuration (`eas.json`, `app.json`) for Android & iOS builds.

---

### Phase 6: Automated Testing & Production Readiness
- [ ] Task 6.1: Backend Pytest suite covering auth, RBAC boundaries, student/faculty creation, attendance submission, fee calculation, payment recording, and receipt generation.
- [ ] Task 6.2: Frontend validation and smoke tests.
- [ ] Task 6.3: Verification of Render Dockerfile, Vercel build configs, and deployment checklist.
