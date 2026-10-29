"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit2,
  Loader2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { AttendanceSession, AttendanceStatus, Batch } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function AdminAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [newStatus, setNewStatus] = useState<AttendanceStatus>("PRESENT");
  const [correctionReason, setCorrectionReason] = useState("");

  const { data: batches } = useQuery<Batch[]>({
    queryKey: ["admin-batches"],
    queryFn: () => apiClient.get<Batch[]>("/batches"),
  });

  const { data: sessions, isLoading } = useQuery<AttendanceSession[]>({
    queryKey: ["admin-attendance-sessions", selectedBatch],
    queryFn: () =>
      apiClient.get<AttendanceSession[]>("/attendance/sessions", {
        batch_id: selectedBatch || undefined,
      }),
  });

  const correctAttendanceMutation = useMutation({
    mutationFn: ({ recordId, newStatus, reason }: any) =>
      apiClient.patch(`/attendance/records/${recordId}/correct`, {
        new_status: newStatus,
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attendance-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setIsCorrectModalOpen(false);
      setCorrectionReason("");
    },
  });

  const handleExportCsv = () => {
    const url = apiClient.getDownloadUrl(
      `/reports/attendance-export${selectedBatch ? `?batch_id=${selectedBatch}` : ""}`
    );
    window.open(url, "_blank");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Audit & Records</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review daily batch roll calls, enforce compliance thresholds, and review correction change logs.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-xl border flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-600">Batch Cohort:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Cohorts</option>
              {batches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Topic Covered</th>
                  <th className="py-3 px-4">Present / Total</th>
                  <th className="py-3 px-4">Attendance Rate</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading attendance records...
                    </td>
                  </tr>
                ) : !sessions?.length ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No attendance roll-calls recorded yet.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => {
                    const pct =
                      s.total_students > 0
                        ? Math.round((s.present_count / s.total_students) * 100)
                        : 0;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {formatDate(s.session_date)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{s.batch_name}</td>
                        <td className="py-3 px-4 text-slate-600">{s.faculty_name}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {s.topic_covered || "Regular Class"}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          {s.present_count} / {s.total_students}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded font-semibold text-[11px] ${
                              pct >= 80
                                ? "bg-emerald-50 text-emerald-700"
                                : pct >= 70
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setActiveSession(s);
                              setIsRecordModalOpen(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-700 font-semibold transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Roster</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Session Roster Modal */}
        {isRecordModalOpen && activeSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl relative max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="border-b pb-3 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Attendance Roll-Call: {activeSession.batch_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conducted on {formatDate(activeSession.session_date)} by {activeSession.faculty_name}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase">
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Roll / Code</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Remarks</th>
                      <th className="py-2.5 px-3 text-right">Correction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSession.records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{r.student_name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{r.student_code}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                              r.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-700"
                                : r.status === "ABSENT"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{r.remarks || "—"}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedRecordId(r.id);
                              setSelectedStudentName(r.student_name);
                              setNewStatus(r.status);
                              setIsCorrectModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"
                            title="Audit Correct Status"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Correction Modal */}
        {isCorrectModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
              <button
                onClick={() => setIsCorrectModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-bold text-slate-900 mb-1">
                Audit Attendance Correction
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Updating status for <span className="font-semibold text-slate-800">{selectedStudentName}</span>.
                A mandatory justification reason will be permanently recorded in the audit trail.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  correctAttendanceMutation.mutate({
                    recordId: selectedRecordId,
                    newStatus,
                    reason: correctionReason,
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="LATE">LATE</option>
                    <option value="EXCUSED">EXCUSED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Justification Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="e.g. Student submitted doctor's note for medical excuse on 28th."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCorrectModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={correctAttendanceMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {correctAttendanceMutation.isPending ? "Recording..." : "Save Correction"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
