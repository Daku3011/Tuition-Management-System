"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Plus,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  Eye,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { Student, PaginatedResponse, Batch } from "@tms/shared-types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Form states for Add Student
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gradeLevel, setGradeLevel] = useState("Grade 10");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [enrolledBatchId, setEnrolledBatchId] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch batches for filter and assignment dropdown
  const { data: batches } = useQuery<Batch[]>({
    queryKey: ["admin-batches-list"],
    queryFn: () => apiClient.get<Batch[]>("/batches"),
  });

  // Fetch students
  const { data: studentsData, isLoading } = useQuery<PaginatedResponse<Student>>({
    queryKey: ["admin-students", search, page, selectedBatch],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Student>>("/students", {
        search: search || undefined,
        batch_id: selectedBatch || undefined,
        page,
        limit: 15,
      }),
  });

  // Add Student mutation
  const addStudentMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post<Student>("/students", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setModalError(err?.message || "Failed to register student");
    },
  });

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setGradeLevel("Grade 10");
    setGuardianName("");
    setGuardianPhone("");
    setEnrolledBatchId("");
    setModalError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    addStudentMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      grade_level: gradeLevel,
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
      batch_ids: enrolledBatchId ? [enrolledBatchId] : [],
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain academic profiles, enrollment rosters, and guardian emergency records.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by student name, code, email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <select
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Batches</option>
              {batches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Fee Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading student roster...
                    </td>
                  </tr>
                ) : !studentsData?.items?.length ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  studentsData.items.map((student) => {
                    const fullName = student.user?.profile?.full_name || "Unknown";
                    const email = student.user?.email || "No email";
                    const batchNames = student.enrolled_batches.map((b) => b.name).join(", ") || "Unassigned";

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                              {student.user?.profile?.first_name?.[0] || "S"}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{fullName}</p>
                              <p className="text-slate-400 text-[11px]">{email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {student.student_id_code}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{batchNames}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded font-semibold text-[11px] ${
                              (student.attendance_rate || 0) >= 80
                                ? "bg-emerald-50 text-emerald-700"
                                : (student.attendance_rate || 0) >= 70
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {student.attendance_rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {formatCurrency(student.pending_fee_balance || 0)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                              student.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setActiveStudent(student);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 hover:text-indigo-600 transition"
                            title="View Profile Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {studentsData && studentsData.total_pages > 1 && (
            <div className="p-4 border-t flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing page {studentsData.page} of {studentsData.total_pages} ({studentsData.total} total students)
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= studentsData.total_pages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Student Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-1">Enroll New Student</h2>
              <p className="text-xs text-slate-500 mb-4">
                Register student credentials, batch enrollment, and guardian contacts.
              </p>

              {modalError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Student Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@domain.com"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98250..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Grade Level</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assign to Batch</label>
                    <select
                      value={enrolledBatchId}
                      onChange={(e) => setEnrolledBatchId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Batch (Optional)</option>
                      {batches?.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.enrolled_count}/{b.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="font-semibold text-slate-800 mb-2">Guardian / Parent Contact</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Guardian Name</label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Guardian Phone</label>
                      <input
                        type="text"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addStudentMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center space-x-2 disabled:opacity-50"
                  >
                    {addStudentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Enrolling...</span>
                      </>
                    ) : (
                      <span>Complete Enrollment</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Student 360 Detail Modal */}
        {isDetailModalOpen && activeStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg">
                  {activeStudent.user?.profile?.first_name?.[0] || "S"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeStudent.user?.profile?.full_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {activeStudent.student_id_code} • {activeStudent.grade_level}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-t pt-4">
                <div>
                  <span className="text-slate-400 block mb-0.5">Email</span>
                  <span className="font-semibold text-slate-800">{activeStudent.user?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Phone</span>
                  <span className="font-semibold text-slate-800">
                    {activeStudent.user?.profile?.phone || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Admission Date</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(activeStudent.admission_date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Attendance Record</span>
                  <span className="font-semibold text-emerald-600">
                    {activeStudent.attendance_rate}% Overall
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Guardian Name</span>
                  <span className="font-semibold text-slate-800">
                    {activeStudent.guardian_name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Guardian Phone</span>
                  <span className="font-semibold text-slate-800">
                    {activeStudent.guardian_phone || "N/A"}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
