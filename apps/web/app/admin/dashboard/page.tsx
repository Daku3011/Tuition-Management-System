"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Briefcase,
  Layers,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Receipt,
  PlusCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { DashboardStats } from "@tms/shared-types";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => apiClient.get<DashboardStats>("/reports/dashboard-stats"),
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Institute Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live operational metrics, attendance logs, and financial reconciliation.
            </p>
          </div>
          <div className="flex items-center space-x-3 flex-wrap">
            <Link
              href="/admin/students"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Student</span>
            </Link>
            <Link
              href="/admin/fees"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Receipt className="h-4 w-4" />
              <span>Record Fee</span>
            </Link>
            <Link
              href="/admin/batches"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Batch</span>
            </Link>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-28 bg-white border rounded-xl animate-pulse p-4" />
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            Failed to load dashboard metrics. Ensure backend service is online.
          </div>
        )}

        {stats && (
          <>
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Active Students */}
              <div className="bg-white p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Active Students
                  </span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {stats.active_students_count}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold ml-2">Enrolled</span>
                </div>
              </div>

              {/* Faculty Members */}
              <div className="bg-white p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Faculty Staff
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Briefcase className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {stats.faculty_count}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-2">Active Instructors</span>
                </div>
              </div>

              {/* Batches & Classes */}
              <div className="bg-white p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ongoing Batches
                  </span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {stats.active_batches_count}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-2">
                    {stats.today_classes_count} Classes Scheduled Today
                  </span>
                </div>
              </div>

              {/* Today's Attendance Rate */}
              <div className="bg-white p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Attendance Rate
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-emerald-600">
                    {stats.today_attendance_percentage}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-2">Recent Sessions</span>
                </div>
              </div>

              {/* Monthly Fee Collection */}
              <div className="bg-white p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Collected This Month
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {formatCurrency(stats.fees_collected_this_month)}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold block mt-0.5">Verified</span>
                </div>
              </div>

              {/* Outstanding Fee Balance */}
              <div className="bg-white p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Outstanding Balance
                  </span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-amber-600">
                    {formatCurrency(stats.outstanding_fee_balance)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">Total Receivable</span>
                </div>
              </div>

              {/* Overdue Installments */}
              <div className="bg-white p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Overdue Installments
                  </span>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-rose-600">
                    {stats.overdue_installments_count}
                  </span>
                  <span className="text-xs text-rose-500 font-semibold ml-2">Requires Follow-up</span>
                </div>
              </div>

              {/* Upcoming Exams */}
              <div className="bg-white p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Upcoming Exams
                  </span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {stats.upcoming_exams_count}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-2">Scheduled Tests</span>
                </div>
              </div>
            </div>

            {/* Financial Collection Visualizer */}
            <div className="bg-white p-6 rounded-2xl border shadow-2xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Monthly Fee Collection Trend</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Actual Collections vs Targets (in INR ₹)</p>
                </div>
                <Link
                  href="/admin/fees"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View Full Ledger →
                </Link>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthly_collection_trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Amount"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="collected" fill="#4f46e5" name="Collected (₹)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#cbd5e1" name="Target (₹)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
