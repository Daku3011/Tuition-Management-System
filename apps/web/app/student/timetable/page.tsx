"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { StudentLayout } from "@/components/layouts/student-layout";
import { apiClient } from "@/lib/api-client";
import { ClassSession } from "@tms/shared-types";

export default function StudentTimetablePage() {
  const { data: sessions, isLoading } = useQuery<ClassSession[]>({
    queryKey: ["student-timetable-full"],
    queryFn: () => apiClient.get<ClassSession[]>("/timetable"),
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Class Timetable</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly lecture schedule for your enrolled batches and subjects.
          </p>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Room / Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading schedule...
                    </td>
                  </tr>
                ) : !sessions?.length ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No lecture schedule found for your batches.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{days[s.day_of_week] || "N/A"}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {s.start_time} - {s.end_time}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">{s.subject_name}</td>
                      <td className="py-3 px-4 text-slate-700">{s.batch_name}</td>
                      <td className="py-3 px-4 text-slate-600">{s.faculty_name}</td>
                      <td className="py-3 px-4 text-slate-500">{s.room_or_link || "Room 101"}</td>
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
