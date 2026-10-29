"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  Award,
  Loader2,
  X,
  UploadCloud,
} from "lucide-react";
import { StudentLayout } from "@/components/layouts/student-layout";
import { apiClient } from "@/lib/api-client";
import { Assignment } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function StudentHomeworkPage() {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["student-assignments-view"],
    queryFn: () => apiClient.get<Assignment[]>("/assignments"),
  });

  const submitHomeworkMutation = useMutation({
    mutationFn: ({ assignmentId, payload }: any) =>
      apiClient.post(`/assignments/${assignmentId}/submit`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-assignments-view"] });
      setSelectedAssignment(null);
      setSubmissionContent("");
      setAttachmentUrl("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    submitHomeworkMutation.mutate({
      assignmentId: selectedAssignment.id,
      payload: {
        content: submissionContent,
        attachment_url: attachmentUrl || undefined,
      },
    });
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Homework & Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review instructions, submit completed assignments, and view teacher marks and feedback.
          </p>
        </div>

        {submitSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Homework submitted successfully! Your teacher will review it shortly.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-slate-400">Loading assignments...</div>
          ) : !assignments?.length ? (
            <div className="col-span-3 text-center py-12 text-slate-500">No active assignments assigned.</div>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                      {a.subject_name}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {a.max_marks} pts
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mt-1">{a.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                    {a.description}
                  </p>

                  <div className="mt-4 border-t pt-3 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Instructor:</span>
                      <span className="font-semibold text-slate-800">{a.faculty_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Deadline:</span>
                      <span className="font-semibold text-slate-800">{formatDate(a.due_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t">
                  <button
                    onClick={() => setSelectedAssignment(a)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Submit Work</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Submit Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-base font-bold text-slate-900 mb-1">
                Submit: {selectedAssignment.title}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Due: {formatDate(selectedAssignment.due_date)} • Max Score: {selectedAssignment.max_marks} points
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Your Response / Notes *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="Type in your answers or derivation steps..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Document or Google Drive Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(null)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitHomeworkMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {submitHomeworkMutation.isPending ? "Uploading..." : "Confirm Submission"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
