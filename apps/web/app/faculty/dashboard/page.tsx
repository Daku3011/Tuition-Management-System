"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  BookOpen,
  Users,
  Clock,
  Layers,
  ArrowRight,
  Bell,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { FacultyLayout } from "@/components/layouts/faculty-layout";
import { apiClient } from "@/lib/api-client";
import { Assignment, Announcement } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function FacultyDashboardPage() {
  const { data: assignedClasses, isLoading: classesLoading } = useQuery<any[]>({
    queryKey: ["faculty-classes"],
    queryFn: () => apiClient.get<any[]>("/faculty/me/classes"),
  });

  const { data: assignments, isLoading: hwLoading } = useQuery<Assignment[]>({
    queryKey: ["faculty-assignments-list"],
    queryFn: () => apiClient.get<Assignment[]>("/assignments"),
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["faculty-announcements"],
    queryFn: () => apiClient.get<Announcement[]>("/announcements"),
  });

  return (
    <FacultyLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your daily lectures, student attendance roll-calls, and homework grading.
          </p>
        </div>

        {/* Action Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Daily Operations
              </span>
              <h2 className="text-xl font-bold mt-1">Ready for Class Attendance?</h2>
              <p className="text-xs text-blue-100 mt-2">
                Conduct roll calls with one click. Changes and corrections are permanently tracked with audit logs.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/faculty/attendance"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition shadow-sm"
              >
                <span>Launch Attendance Register</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Assessments & Homework
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Pending Homework Reviews</h2>
              <p className="text-xs text-slate-500 mt-2">
                Review student answers, assign marks out of maximum points, and provide constructive feedback.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/faculty/homework"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
              >
                <span>Grade Submissions</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Assigned Batches */}
        <div className="bg-white border rounded-2xl p-6 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Your Assigned Teaching Batches</h2>
          <p className="text-xs text-slate-500 mb-4">Batches and courses where you are assigned as lead instructor</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classesLoading ? (
              <div className="col-span-3 text-center py-8 text-slate-400">Loading assignments...</div>
            ) : !assignedClasses?.length ? (
              <div className="col-span-3 text-center py-8 text-slate-500">No batches currently assigned.</div>
            ) : (
              assignedClasses.map((item, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-slate-50 hover:bg-white transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.batch_name}</h4>
                      <span className="text-[11px] font-mono text-indigo-600 font-semibold">{item.batch_code}</span>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">
                      {item.role}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Subject: {item.subject_name}</p>
                    <p>Program: {item.course_name}</p>
                    <p>Enrolled Students: {item.enrolled_count}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notices */}
        {announcements && announcements.length > 0 && (
          <div className="bg-white border rounded-2xl p-6 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Bell className="h-4 w-4 text-indigo-600" />
              <span>Institute Bulletins</span>
            </h2>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 border rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{a.title}</span>
                    <span className="text-[11px] text-slate-400">{formatDate(a.published_at)}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
