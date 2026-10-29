"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  Calendar,
  CalendarCheck,
  BookOpen,
  CreditCard,
  ArrowRight,
  Bell,
  Clock,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";
import { StudentLayout } from "@/components/layouts/student-layout";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { ClassSession, Assignment, Announcement, StudentFeeAssignment } from "@tms/shared-types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function StudentDashboardPage() {
  const { user } = useAuth();

  const { data: timetable } = useQuery<ClassSession[]>({
    queryKey: ["student-timetable"],
    queryFn: () => apiClient.get<ClassSession[]>("/timetable"),
  });

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ["student-assignments"],
    queryFn: () => apiClient.get<Assignment[]>("/assignments"),
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["student-announcements"],
    queryFn: () => apiClient.get<Announcement[]>("/announcements"),
  });

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-200">
            Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome back, {user?.profile?.first_name || "Student"}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-2xl leading-relaxed">
            Stay on track with your upcoming classes, submit pending homework on time, and track your attendance record.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/student/timetable"
              className="px-4 py-2 bg-white text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-50 transition shadow-xs"
            >
              View Class Schedule
            </Link>
            <Link
              href="/student/homework"
              className="px-4 py-2 bg-emerald-800/60 text-white border border-emerald-400/40 rounded-lg text-xs font-bold hover:bg-emerald-800 transition"
            >
              Submit Homework
            </Link>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Overall Attendance</span>
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-emerald-600">92.5%</span>
              <span className="text-xs text-slate-400 block mt-0.5">Complies with institute policy</span>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Active Assignments</span>
              <BookOpen className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {assignments?.length || 0}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Tasks assigned to cohort</span>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Fee Invoices & Receipts</span>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-3">
              <span className="text-base font-extrabold text-slate-900">Official Receipts</span>
              <Link
                href="/student/fees"
                className="text-xs text-purple-600 hover:text-purple-700 font-bold block mt-1"
              >
                Download PDF Receipts →
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Lectures */}
        <div className="bg-white border rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Class Schedule</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your timetable for today</p>
            </div>
            <Link
              href="/student/timetable"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Full Timetable →
            </Link>
          </div>

          <div className="space-y-3">
            {!timetable?.length ? (
              <p className="text-xs text-slate-500 py-4">No scheduled lectures for today.</p>
            ) : (
              timetable.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{item.subject_name}</p>
                      <p className="text-slate-500">
                        {item.faculty_name} • {item.room_or_link || "Room 101"}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-1 border rounded-md">
                    {item.start_time} - {item.end_time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements */}
        {announcements && announcements.length > 0 && (
          <div className="bg-white border rounded-2xl p-6 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              <span>Announcements from Institute</span>
            </h2>
            <div className="space-y-3">
              {announcements.slice(0, 2).map((a) => (
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
    </StudentLayout>
  );
}
