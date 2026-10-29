"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  X,
  Award,
  Edit3,
} from "lucide-react";
import { FacultyLayout } from "@/components/layouts/faculty-layout";
import { apiClient } from "@/lib/api-client";
import { Examination, ExamSubject, Student } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function FacultyExaminationsPage() {
  const queryClient = useQueryClient();
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
  const [marksMap, setMarksMap] = useState<Record<string, number>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: exams, isLoading: examsLoading } = useQuery<Examination[]>({
    queryKey: ["faculty-examinations"],
    queryFn: () => apiClient.get<Examination[]>("/examinations"),
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery<{ items: Student[] }>({
    queryKey: ["faculty-exam-students", selectedExam?.batch_id],
    queryFn: () =>
      apiClient.get<{ items: Student[] }>(
        `/students?limit=50${selectedExam?.batch_id ? `&batch_id=${selectedExam.batch_id}` : ""}`
      ),
    enabled: !!selectedExam?.batch_id,
  });

  const students = studentsData?.items || [];

  const handleOpenMarksModal = (exam: Examination, subj: ExamSubject) => {
    setSelectedExam(exam);
    setSelectedSubject(subj);
    setSuccessMessage(null);
    setErrorMessage(null);
    // Initialize default marks for students if not set
    const initialMarks: Record<string, number> = {};
    const initialRemarks: Record<string, string> = {};
    setMarksMap(initialMarks);
    setRemarksMap(initialRemarks);
  };

  const submitMarksMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubject) throw new Error("No exam subject selected");

      const results = students.map((s) => {
        const marks = marksMap[s.id] ?? Math.round(selectedSubject.max_marks * 0.75);
        return {
          student_id: s.id,
          marks_obtained: marks,
          remarks: remarksMap[s.id] || "Good performance",
        };
      });

      return apiClient.post("/examinations/results/batch-entry", {
        exam_subject_id: selectedSubject.id,
        results,
      });
    },
    onSuccess: () => {
      setSuccessMessage("Marks and grades recorded successfully!");
      queryClient.invalidateQueries({ queryKey: ["faculty-examinations"] });
      setTimeout(() => {
        setSelectedSubject(null);
        setSelectedExam(null);
        setSuccessMessage(null);
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || "Failed to record marks");
    },
  });

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examinations & Marks Entry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View scheduled cohort assessments, enter test scores, and submit evaluated marks.
          </p>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {examsLoading ? (
            <div className="col-span-3 text-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
              Loading exam schedules...
            </div>
          ) : !exams?.length ? (
            <div className="col-span-3 text-center py-12 text-slate-500 bg-white border rounded-2xl p-8">
              <FileCheck2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No examinations scheduled yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Upcoming assessments created by the administration will appear here.
              </p>
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
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
                    <span className="text-xs font-semibold text-slate-700">Subject Papers & Marks Entry:</span>
                    {exam.subjects.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-lg text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{s.subject_name}</p>
                          <p className="text-slate-500 font-mono text-[11px]">
                            Max: {s.max_marks} | Pass: {s.passing_marks}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenMarksModal(exam, s)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Enter Marks</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t flex items-center justify-between text-xs text-slate-500">
                  <span>Type: {exam.exam_type}</span>
                  {exam.status === "PUBLISHED" ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Published</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-amber-600 font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Draft / In Progress</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Enter Marks Modal */}
        {selectedSubject && selectedExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden border animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
                <div>
                  <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                    {selectedExam.title} • {selectedExam.batch_name}
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Marks Entry: {selectedSubject.subject_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Max Marks: <span className="font-bold">{selectedSubject.max_marks}</span> • Passing Marks:{" "}
                    <span className="font-bold">{selectedSubject.passing_marks}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {successMessage && (
                <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {studentsLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading student roster...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No students found in this batch.</div>
                ) : (
                  students.map((st) => {
                    const stName = `${st.user?.profile?.first_name || ""} ${st.user?.profile?.last_name || ""}`.trim() || st.student_id_code;
                    const marks = marksMap[st.id] ?? Math.round(selectedSubject.max_marks * 0.75);
                    const pct = (marks / selectedSubject.max_marks) * 100;
                    const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 65 ? "B" : pct >= 50 ? "C" : pct >= 35 ? "D" : "F";
                    const isPassed = marks >= selectedSubject.passing_marks;

                    return (
                      <div
                        key={st.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-xl bg-slate-50/50 gap-3"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{stName}</p>
                          <p className="text-xs text-slate-500">ID: {st.student_id_code}</p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1.5">
                            <label className="text-xs font-semibold text-slate-600">Score:</label>
                            <input
                              type="number"
                              min={0}
                              max={selectedSubject.max_marks}
                              value={marks}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setMarksMap((prev) => ({ ...prev, [st.id]: val }));
                              }}
                              className="w-16 px-2 py-1 text-sm font-semibold border rounded text-center focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-400">/ {selectedSubject.max_marks}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                isPassed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              Grade {grade}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubject(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => submitMarksMutation.mutate()}
                  disabled={submitMarksMutation.isPending || students.length === 0}
                  className="inline-flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {submitMarksMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Marks...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Batch Marks</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
