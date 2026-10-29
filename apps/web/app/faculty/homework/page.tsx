"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  Loader2,
  X,
  FileText,
  Send,
  AlertCircle,
} from "lucide-react";
import { FacultyLayout } from "@/components/layouts/faculty-layout";
import { apiClient } from "@/lib/api-client";
import { Assignment, AssignmentSubmission } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function FacultyHomeworkPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // New assignment form
  const [batchId, setBatchId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState<number>(50);
  const [modalError, setModalError] = useState<string | null>(null);

  // Grading states
  const [selectedSub, setSelectedSub] = useState<AssignmentSubmission | null>(null);
  const [gradingMarks, setGradingMarks] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState<string>("");

  const { data: assignedClasses } = useQuery<any[]>({
    queryKey: ["faculty-classes"],
    queryFn: () => apiClient.get<any[]>("/faculty/me/classes"),
  });

  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["faculty-assignments"],
    queryFn: () => apiClient.get<Assignment[]>("/assignments"),
  });

  const { data: submissions, isLoading: subsLoading } = useQuery<AssignmentSubmission[]>({
    queryKey: ["assignment-submissions", selectedAssignment?.id],
    queryFn: () => apiClient.get<AssignmentSubmission[]>(`/assignments/${selectedAssignment?.id}/submissions`),
    enabled: !!selectedAssignment,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post<Assignment>("/assignments", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-assignments"] });
      setIsCreateModalOpen(false);
      setTitle("");
      setDescription("");
      setModalError(null);
    },
    onError: (err: any) => setModalError(err?.message || "Failed to publish assignment"),
  });

  const gradeSubmissionMutation = useMutation({
    mutationFn: ({ subId, payload }: any) =>
      apiClient.post(`/assignments/submissions/${subId}/review`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", selectedAssignment?.id] });
      queryClient.invalidateQueries({ queryKey: ["faculty-assignments"] });
      setSelectedSub(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !subjectId) {
      setModalError("Please select batch and subject");
      return;
    }

    createAssignmentMutation.mutate({
      batch_id: batchId,
      subject_id: subjectId,
      title,
      description,
      due_date: new Date(dueDate).toISOString(),
      max_marks: Number(maxMarks),
    });
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Homework & Assignments</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Publish task descriptions, review uploaded student work, and award grades.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Assignment</span>
          </button>
        </div>

        {/* Assignment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-slate-400">Loading assignments...</div>
          ) : !assignments?.length ? (
            <div className="col-span-3 text-center py-12 text-slate-500">No assignments created yet.</div>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                      {a.batch_name}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      Max: {a.max_marks} pts
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mt-1">{a.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {a.description}
                  </p>

                  <div className="mt-4 border-t pt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Subject:</span>
                      <span className="font-semibold text-slate-800">{a.subject_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Due Date:</span>
                      <span className="font-semibold text-slate-800">{formatDate(a.due_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600">
                    {a.total_submissions} Submissions
                  </span>
                  <button
                    onClick={() => {
                      setSelectedAssignment(a);
                      setIsSubmissionsModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-bold transition"
                  >
                    Review Work →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Assignment Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-1">Create Homework Assignment</h2>
              <p className="text-xs text-slate-500 mb-4">
                Will be published to the enrolled students of the selected batch cohort.
              </p>

              {modalError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Batch & Subject *</label>
                  <select
                    required
                    value={`${batchId}:${subjectId}`}
                    onChange={(e) => {
                      const [b, s] = e.target.value.split(":");
                      setBatchId(b);
                      setSubjectId(s);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value=":">-- Choose Assigned Class --</option>
                    {assignedClasses?.map((c, i) => (
                      <option key={i} value={`${c.batch_id}:${c.subject_id}`}>
                        {c.batch_name} • {c.subject_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignment Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Problem Set 5: Rotational Dynamics"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instructions & Problem Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide full instructions or exercise numbers..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Submission Deadline *</label>
                    <input
                      type="datetime-local"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Max Marks *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000}
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAssignmentMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createAssignmentMutation.isPending ? "Publishing..." : "Publish Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Review Submissions Modal */}
        {isSubmissionsModalOpen && selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl relative max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => {
                  setIsSubmissionsModalOpen(false);
                  setSelectedSub(null);
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-base font-bold text-slate-900 mb-1">
                Submissions: {selectedAssignment.title}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Batch: {selectedAssignment.batch_name} • Max Marks: {selectedAssignment.max_marks}
              </p>

              {subsLoading ? (
                <div className="py-8 text-center text-slate-400">Loading submissions...</div>
              ) : !submissions?.length ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No students have submitted work for this assignment yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 border rounded-xl bg-slate-50 hover:bg-white transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{sub.student_name}</span>
                          <span className="font-mono text-slate-400">({sub.student_code})</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.status === "REVIEWED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1 italic">"{sub.content || "Work uploaded"}"</p>
                        {sub.marks_obtained !== null && (
                          <p className="mt-1 font-semibold text-emerald-700">
                            Grade: {sub.marks_obtained} / {sub.max_marks} pts • Feedback: {sub.feedback || "Good"}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setGradingMarks(sub.marks_obtained || 0);
                          setGradingFeedback(sub.feedback || "");
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shrink-0 self-start md:self-auto"
                      >
                        {sub.status === "REVIEWED" ? "Edit Grade" : "Grade Submission"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Grading Box */}
              {selectedSub && (
                <div className="mt-6 p-4 border-2 border-blue-500 rounded-xl bg-blue-50/50 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">
                    Grading: {selectedSub.student_name} ({selectedSub.student_code})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Marks Awarded (out of {selectedSub.max_marks}) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={selectedSub.max_marks}
                        step="0.5"
                        value={gradingMarks}
                        onChange={(e) => setGradingMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg bg-white font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Instructor Feedback</label>
                      <input
                        type="text"
                        value={gradingFeedback}
                        onChange={(e) => setGradingFeedback(e.target.value)}
                        placeholder="e.g. Excellent solution steps and clear diagram."
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSub(null)}
                      className="px-3 py-1.5 border rounded-lg bg-white text-slate-700 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        gradeSubmissionMutation.mutate({
                          subId: selectedSub.id,
                          payload: {
                            marks_obtained: gradingMarks,
                            feedback: gradingFeedback,
                          },
                        })
                      }
                      disabled={gradeSubmissionMutation.isPending}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {gradeSubmissionMutation.isPending ? "Saving..." : "Save Grade & Feedback"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
