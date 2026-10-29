"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
import { StudentLayout } from "@/components/layouts/student-layout";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { ExamResult } from "@tms/shared-types";

export default function StudentResultsPage() {
  const { user } = useAuth();

  const { data: results, isLoading } = useQuery<ExamResult[]>({
    queryKey: ["student-results-view"],
    queryFn: async () => {
      // Fetch student record for user id
      const studentProfile = await apiClient.get<any>("/students?limit=100");
      const currentStudent = studentProfile?.items?.find((s: any) => s.user?.id === user?.id);
      if (!currentStudent) return [];
      return apiClient.get<ExamResult[]>(`/examinations/student/${currentStudent.id}`);
    },
    enabled: !!user,
  });

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examination Scorecards</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official academic test results and instructor performance appraisals.
          </p>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Marks Awarded</th>
                  <th className="py-3 px-4">Max Marks</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Teacher's Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading report cards...
                    </td>
                  </tr>
                ) : !results?.length ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No published results available at this time.
                    </td>
                  </tr>
                ) : (
                  results.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.subject_name}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 text-sm">
                        {r.marks_obtained}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{r.max_marks}</td>
                      <td className="py-3.5 px-4 font-bold text-indigo-700">{r.grade || "A"}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.is_passed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {r.is_passed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>PASSED</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              <span>NEEDS IMPROVEMENT</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 italic">{r.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
