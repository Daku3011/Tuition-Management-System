"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { StudentLayout } from "@/components/layouts/student-layout";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function StudentAttendancePage() {
  const { user } = useAuth();

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Record</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified attendance roll-call history and mandatory minimum compliance status.
          </p>
        </div>

        {/* Attendance Score Card */}
        <div className="bg-white border rounded-2xl p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Attendance Record
              </span>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="text-4xl font-extrabold text-emerald-600">92.5%</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Exceeds 75% Requirement
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border">
                <span className="text-slate-400 block text-[11px]">Total Classes</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block">24</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <span className="text-emerald-700 block text-[11px]">Present</span>
                <span className="text-lg font-bold text-emerald-800 mt-0.5 block">22</span>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                <span className="text-rose-700 block text-[11px]">Absent</span>
                <span className="text-lg font-bold text-rose-800 mt-0.5 block">2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-3 text-xs text-blue-900">
          <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Institute Minimum Attendance Requirement: 75%</span>
            <p className="mt-0.5 text-blue-800 leading-relaxed">
              Maintaining above 75% attendance is required to appear for term examinations and Olympiad mock tests.
              All absences must be covered by guardian medical notes submitted to the administration.
            </p>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
