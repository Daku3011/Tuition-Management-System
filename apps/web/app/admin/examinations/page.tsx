"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileCheck2,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  X,
  Award,
} from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { Examination, Batch } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function AdminExaminationsPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examType, setExamType] = useState("Term Exam");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [modalError, setModalError] = useState<string | null>(null);

  const { data: exams, isLoading } = useQuery<Examination[]>({
    queryKey: ["admin-examinations"],
    queryFn: () => apiClient.get<Examination[]>("/examinations"),
  });

  const { data: batches } = useQuery<Batch[]>({
    queryKey: ["admin-batches"],
    queryFn: () => apiClient.get<Batch[]>("/batches"),
  });

  const publishExamMutation = useMutation({
    mutationFn: (examId: string) => apiClient.post(`/examinations/${examId}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-examinations"] });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examinations & Results</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Schedule assessments, oversee marks entry, and publish verified report cards.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Examination</span>
          </button>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-slate-400">Loading exams...</div>
          ) : !exams?.length ? (
            <div className="col-span-3 text-center py-12 text-slate-500">No exams scheduled yet.</div>
          ) : (
            exams.map((exam) => (
              <div key={exam.id} className="bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                        {exam.batch_name}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{exam.title}</h3>
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                        exam.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {exam.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDate(exam.start_date)} - {formatDate(exam.end_date)}
                    </span>
                  </div>

                  <div className="mt-4 border-t pt-3 space-y-2">
                    <span className="text-xs font-semibold text-slate-700">Subject Papers:</span>
                    {exam.subjects.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs"
                      >
                        <span className="font-medium text-slate-800">{s.subject_name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          Max: {s.max_marks} (Pass: {s.passing_marks})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t flex items-center justify-between">
                  {exam.status !== "PUBLISHED" ? (
                    <button
                      onClick={() => publishExamMutation.mutate(exam.id)}
                      disabled={publishExamMutation.isPending}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Publish Results</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Published to Student Portal</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
