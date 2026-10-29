"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Check,
  X,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";
import { FacultyLayout } from "@/components/layouts/faculty-layout";
import { apiClient } from "@/lib/api-client";
import { AttendanceStatus } from "@tms/shared-types";

interface EnrolledStudent {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  roll_number?: string;
}

export default function FacultyAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [topicCovered, setTopicCovered] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch faculty assigned classes
  const { data: assignedClasses } = useQuery<any[]>({
    queryKey: ["faculty-classes"],
    queryFn: () => apiClient.get<any[]>("/faculty/me/classes"),
  });

  // Auto-select first batch if available
  useEffect(() => {
    if (assignedClasses && assignedClasses.length > 0 && !selectedBatchId) {
      setSelectedBatchId(assignedClasses[0].batch_id);
    }
  }, [assignedClasses, selectedBatchId]);

  // Fetch enrolled students for selected batch
  const { data: students, isLoading: studentsLoading } = useQuery<EnrolledStudent[]>({
    queryKey: ["batch-students", selectedBatchId],
    queryFn: () => apiClient.get<EnrolledStudent[]>(`/batches/${selectedBatchId}/students`),
    enabled: !!selectedBatchId,
  });

  // Initialize attendance records when students load
  useEffect(() => {
    if (students) {
      const initial: Record<string, AttendanceStatus> = {};
      students.forEach((s) => {
        initial[s.student_id] = "PRESENT";
      });
      setAttendanceMap(initial);
    }
  }, [students]);

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!students) return;
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.student_id] = status;
    });
    setAttendanceMap(updated);
  };

  const submitAttendanceMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post("/attendance/submit", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attendance-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setSubmitSuccess(true);
      setErrorMessage(null);
      setTimeout(() => setSubmitSuccess(false), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || "Failed to submit attendance");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !students || students.length === 0) {
      setErrorMessage("No students enrolled in this batch");
      return;
    }

    const records = students.map((s) => ({
      student_id: s.student_id,
      status: attendanceMap[s.student_id] || "PRESENT",
      remarks: remarksMap[s.student_id] || undefined,
    }));

    submitAttendanceMutation.mutate({
      batch_id: selectedBatchId,
      session_date: sessionDate,
      topic_covered: topicCovered,
      records,
    });
  };

  const total = students?.length || 0;
  const presentCount = Object.values(attendanceMap).filter((s) => s === "PRESENT" || s === "LATE").length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === "ABSENT").length;

  return (
    <FacultyLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mark Class Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Conduct verified roll-call for today's lecture. Submit in one step with instant status tallying.
          </p>
        </div>

        {submitSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 text-xs font-semibold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Attendance session successfully submitted and synced with student ledgers!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center space-x-3 text-xs font-semibold">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Configuration Bar */}
        <div className="bg-white border rounded-2xl p-5 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Batch *</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              {assignedClasses?.map((c, i) => (
                <option key={i} value={c.batch_id}>
                  {c.batch_name} ({c.batch_code}) • {c.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date of Session *</label>
            <input
              type="date"
              required
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lecture Topic Covered</label>
            <input
              type="text"
              value={topicCovered}
              onChange={(e) => setTopicCovered(e.target.value)}
              placeholder="e.g. Integration by parts, Problem Set 3"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Roster & Punch Table */}
        <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
          {/* Action Header */}
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Roster ({total} Enrolled)
              </span>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {presentCount} Present
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                  {absentCount} Absent
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleMarkAll("PRESENT")}
                className="px-3 py-1 bg-white border hover:bg-slate-50 text-emerald-700 font-semibold text-xs rounded-lg transition"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll("ABSENT")}
                className="px-3 py-1 bg-white border hover:bg-slate-50 text-rose-700 font-semibold text-xs rounded-lg transition"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white border-b text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsLoading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading cohort roster...
                    </td>
                  </tr>
                ) : !students?.length ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      No active students found in this batch.
                    </td>
                  </tr>
                ) : (
                  students.map((st) => {
                    const currentStatus = attendanceMap[st.student_id] || "PRESENT";

                    return (
                      <tr key={st.student_id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-900">{st.student_name}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{st.student_code}</td>
                        <td className="py-3 px-4">
                          <div className="inline-flex rounded-lg p-1 bg-slate-100 space-x-1">
                            <button
                              type="button"
                              onClick={() =>
                                setAttendanceMap((prev) => ({ ...prev, [st.student_id]: "PRESENT" }))
                              }
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                currentStatus === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAttendanceMap((prev) => ({ ...prev, [st.student_id]: "ABSENT" }))
                              }
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                currentStatus === "ABSENT"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAttendanceMap((prev) => ({ ...prev, [st.student_id]: "LATE" }))
                              }
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                currentStatus === "LATE"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAttendanceMap((prev) => ({ ...prev, [st.student_id]: "EXCUSED" }))
                              }
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                currentStatus === "EXCUSED"
                                  ? "bg-purple-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Excused
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={remarksMap[st.student_id] || ""}
                            onChange={(e) =>
                              setRemarksMap((prev) => ({ ...prev, [st.student_id]: e.target.value }))
                            }
                            placeholder="Optional note..."
                            className="w-full px-2.5 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitAttendanceMutation.isPending || !students?.length}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
            >
              {submitAttendanceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Roll-Call...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Attendance Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
}
