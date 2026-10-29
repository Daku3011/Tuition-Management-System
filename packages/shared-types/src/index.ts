export type UserRole = "SUPER_ADMIN" | "ADMIN" | "FACULTY" | "STUDENT";

export type StudentStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type FacultyStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE";
export type BatchStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "LATE" | "REVIEWED";
export type ExamStatus = "DRAFT" | "PUBLISHED" | "COMPLETED";
export type FeeStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "ONLINE" | "UPI" | "CHEQUE";
export type PaymentStatus = "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
export type AudienceType = "ALL" | "FACULTY" | "STUDENTS" | "BATCH";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
}

export interface User {
  id: string;
  institute_id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string | null;
  profile?: UserProfile | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface BatchInfoSimple {
  id: string;
  name: string;
  code: string;
  course_name?: string | null;
}

export interface Student {
  id: string;
  user_id: string;
  institute_id: string;
  student_id_code: string;
  admission_date: string;
  status: StudentStatus;
  grade_level?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_email?: string | null;
  guardian_relation?: string | null;
  remarks?: string | null;
  is_archived: boolean;
  user?: User | null;
  enrolled_batches: BatchInfoSimple[];
  attendance_rate?: number | null;
  pending_fee_balance?: number | null;
}

export interface Faculty {
  id: string;
  user_id: string;
  institute_id: string;
  faculty_code: string;
  designation: string;
  qualification?: string | null;
  specialization?: string | null;
  joining_date: string;
  status: FacultyStatus;
  bio?: string | null;
  user?: User | null;
  assigned_batches_count: number;
  assigned_students_count: number;
}

export interface Subject {
  id: string;
  course_id: string;
  name: string;
  code: string;
}

export interface Course {
  id: string;
  institute_id: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  subjects: Subject[];
}

export interface FacultyAssignmentItem {
  faculty_id: string;
  faculty_name: string;
  subject_id: string;
  subject_name: string;
  role: string;
}

export interface Batch {
  id: string;
  institute_id: string;
  course_id: string;
  course_name?: string | null;
  academic_year_id?: string | null;
  name: string;
  code: string;
  capacity: number;
  start_date: string;
  end_date?: string | null;
  room_number?: string | null;
  meeting_link?: string | null;
  status: BatchStatus;
  enrolled_count: number;
  faculty_assignments: FacultyAssignmentItem[];
}

export interface ClassSession {
  id: string;
  institute_id: string;
  batch_id: string;
  batch_name: string;
  subject_id: string;
  subject_name: string;
  faculty_id: string;
  faculty_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_or_link?: string | null;
  topic_summary?: string | null;
  is_cancelled: boolean;
}

export interface StudentAttendanceSummary {
  total_classes: number;
  attended_classes: number;
  attendance_percentage: number;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  status: AttendanceStatus;
  remarks?: string | null;
  updated_at: string;
}

export interface AttendanceSession {
  id: string;
  batch_id: string;
  batch_name: string;
  faculty_id: string;
  faculty_name: string;
  session_date: string;
  title?: string | null;
  topic_covered?: string | null;
  status: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  records: AttendanceRecord[];
}

export interface Assignment {
  id: string;
  institute_id: string;
  batch_id: string;
  batch_name: string;
  subject_id: string;
  subject_name: string;
  faculty_id: string;
  faculty_name: string;
  title: string;
  description: string;
  due_date: string;
  max_marks: number;
  attachment_url?: string | null;
  status: string;
  created_at: string;
  total_submissions: number;
  reviewed_submissions: number;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  assignment_title: string;
  student_id: string;
  student_name: string;
  student_code: string;
  submission_date: string;
  content?: string | null;
  attachment_url?: string | null;
  status: SubmissionStatus;
  marks_obtained?: number | null;
  max_marks: number;
  feedback?: string | null;
  reviewed_at?: string | null;
}

export interface StudyMaterial {
  id: string;
  institute_id: string;
  batch_id: string;
  batch_name: string;
  subject_id: string;
  subject_name: string;
  faculty_id: string;
  faculty_name: string;
  title: string;
  description?: string | null;
  file_url: string;
  file_type?: string | null;
  file_size_bytes?: number | null;
  created_at: string;
}

export interface ExamSubject {
  id: string;
  subject_id: string;
  subject_name: string;
  exam_date: string;
  max_marks: number;
  passing_marks: number;
}

export interface Examination {
  id: string;
  institute_id: string;
  batch_id: string;
  batch_name: string;
  title: string;
  exam_type: string;
  start_date: string;
  end_date: string;
  status: ExamStatus;
  subjects: ExamSubject[];
}

export interface ExamResult {
  id: string;
  exam_subject_id: string;
  subject_name: string;
  student_id: string;
  student_name: string;
  student_code: string;
  marks_obtained: number;
  max_marks: number;
  passing_marks: number;
  is_passed: boolean;
  grade?: string | null;
  remarks?: string | null;
  is_published: boolean;
}

export interface FeePlan {
  id: string;
  institute_id: string;
  course_id: string;
  course_name: string;
  name: string;
  description?: string | null;
  total_amount: number;
  currency: string;
  installments_count: number;
}

export interface FeeInstallment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  remaining_balance: number;
  status: FeeStatus;
}

export interface StudentFeeAssignment {
  id: string;
  student_id: string;
  student_name: string;
  fee_plan_id: string;
  fee_plan_name: string;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  total_paid: number;
  balance_due: number;
  status: FeeStatus;
  installments: FeeInstallment[];
}

export interface Payment {
  id: string;
  student_id: string;
  student_name: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_date: string;
  transaction_reference?: string | null;
  status: PaymentStatus;
  notes?: string | null;
  receipt_number?: string | null;
}

export interface Receipt {
  id: string;
  payment_id: string;
  receipt_number: string;
  receipt_date: string;
  student_name: string;
  student_code: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  pdf_url?: string | null;
}

export interface Announcement {
  id: string;
  institute_id: string;
  title: string;
  content: string;
  target_audience: AudienceType;
  batch_id?: string | null;
  priority: string;
  published_at: string;
  created_by_name?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_name?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  ip_address?: string | null;
  details: Record<string, any>;
  timestamp: string;
}

export interface FeeMetricMonth {
  month: string;
  collected: number;
  target: number;
}

export interface DashboardStats {
  active_students_count: number;
  faculty_count: number;
  active_batches_count: number;
  today_classes_count: number;
  today_attendance_percentage: number;
  fees_collected_this_month: number;
  outstanding_fee_balance: number;
  overdue_installments_count: number;
  upcoming_exams_count: number;
  monthly_collection_trend: FeeMetricMonth[];
}

export interface InstituteSettings {
  id: string;
  name: string;
  code: string;
  logo_url?: string | null;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  currency: string;
  timezone: string;
  settings: Record<string, any>;
}
