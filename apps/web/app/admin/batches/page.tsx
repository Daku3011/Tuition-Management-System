"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Layers,
  Plus,
  Users,
  Calendar,
  Clock,
  BookOpen,
  UserCheck,
  Loader2,
  AlertCircle,
  X,
  MapPin,
} from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { Batch, Course, Faculty, ClassSession } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function AdminBatchesPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // New batch form
  const [courseId, setCourseId] = useState("");
  const [batchName, setBatchName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [capacity, setCapacity] = useState(25);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [roomNumber, setRoomNumber] = useState("Hall 101");
  const [meetingLink, setMeetingLink] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Assign faculty form
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [assignRole, setAssignRole] = useState("Lead Instructor");

  // Fetch batches
  const { data: batches, isLoading } = useQuery<Batch[]>({
    queryKey: ["admin-batches"],
    queryFn: () => apiClient.get<Batch[]>("/batches"),
  });

  // Fetch courses
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["admin-courses"],
    queryFn: () => apiClient.get<Course[]>("/courses"),
  });

  // Fetch faculty
  const { data: facultyData } = useQuery<any>({
    queryKey: ["admin-faculty-select"],
    queryFn: () => apiClient.get<any>("/faculty?limit=50"),
  });

  // Fetch timetable
  const { data: timetableSessions } = useQuery<ClassSession[]>({
    queryKey: ["admin-timetable-sessions"],
    queryFn: () => apiClient.get<ClassSession[]>("/timetable"),
  });

  const createBatchMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post<Batch>("/batches", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setIsAddModalOpen(false);
      setBatchName("");
      setBatchCode("");
      setModalError(null);
    },
    onError: (err: any) => setModalError(err?.message || "Failed to create batch"),
  });

  const assignFacultyMutation = useMutation({
    mutationFn: ({ batchId, facultyId, subjectId, role }: any) =>
      apiClient.post(`/batches/${batchId}/assign-faculty`, { faculty_id: facultyId, subject_id: subjectId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-batches"] });
      setIsAssignModalOpen(false);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      setModalError("Please select a course");
      return;
    }
    createBatchMutation.mutate({
      course_id: courseId,
      name: batchName,
      code: batchCode,
      capacity: Number(capacity),
      start_date: startDate,
      room_number: roomNumber,
      meeting_link: meetingLink || undefined,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Batches & Scheduling</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure student cohorts, room allotments, and class timetable schedules.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Batch</span>
          </button>
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading batches...
            </div>
          ) : !batches?.length ? (
            <div className="col-span-3 text-center py-12 text-slate-500">No batches defined yet.</div>
          ) : (
            batches.map((b) => (
              <div key={b.id} className="bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{b.name}</h3>
                      <span className="text-xs font-mono font-semibold text-indigo-600">{b.code}</span>
                    </div>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                      {b.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 font-medium">{b.course_name}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                      <span className="flex items-center space-x-1.5 text-slate-500">
                        <Users className="h-3.5 w-3.5" />
                        <span>Enrollment:</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {b.enrolled_count} / {b.capacity} Students
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5 text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Classroom:</span>
                      </span>
                      <span className="font-semibold text-slate-800">{b.room_number || "Online Room"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5 text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Commenced:</span>
                      </span>
                      <span className="font-semibold text-slate-800">{formatDate(b.start_date)}</span>
                    </div>
                  </div>

                  {/* Assigned Faculty list */}
                  <div className="mt-4 border-t pt-3">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Assigned Instructors:
                    </span>
                    {b.faculty_assignments.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No faculty assigned yet</span>
                    ) : (
                      <div className="space-y-1">
                        {b.faculty_assignments.map((fa, idx) => (
                          <div key={idx} className="text-xs flex items-center justify-between text-slate-700">
                            <span className="font-medium truncate">{fa.faculty_name}</span>
                            <span className="text-indigo-600 text-[11px] font-semibold">
                              {fa.subject_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedBatch(b);
                      setIsAssignModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Assign Instructor</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Timetable Schedule Section */}
        <div className="bg-white border rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Institute Weekly Timetable</h2>
              <p className="text-xs text-slate-500 mt-0.5">Recurring lecture schedule across all batches</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Day</th>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Batch</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Instructor</th>
                  <th className="py-2.5 px-4">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!timetableSessions?.length ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No timetable sessions scheduled.
                    </td>
                  </tr>
                ) : (
                  timetableSessions.map((ts) => {
                    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                    return (
                      <tr key={ts.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-semibold text-slate-900">{days[ts.day_of_week] || "N/A"}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {ts.start_time} - {ts.end_time}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{ts.batch_name}</td>
                        <td className="py-3 px-4 text-indigo-600 font-semibold">{ts.subject_name}</td>
                        <td className="py-3 px-4 text-slate-700">{ts.faculty_name}</td>
                        <td className="py-3 px-4 text-slate-500">{ts.room_or_link || "N/A"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Batch Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-1">Create New Batch</h2>
              <p className="text-xs text-slate-500 mb-4">
                Define batch code, maximum student capacity, and room allotment.
              </p>

              {modalError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Course *</label>
                  <select
                    required
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Course --</option>
                    {courses?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Batch Name *</label>
                    <input
                      type="text"
                      required
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="e.g. Batch 10-Beta"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Batch Code *</label>
                    <input
                      type="text"
                      required
                      value={batchCode}
                      onChange={(e) => setBatchCode(e.target.value)}
                      placeholder="B10-BETA"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Capacity Limit</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={200}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Classroom / Room No.</label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Online Meeting Link</label>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
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
                    disabled={createBatchMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center space-x-2 disabled:opacity-50"
                  >
                    {createBatchMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Save Batch</span>
                    )}
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
