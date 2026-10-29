"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Users, BookOpen, CreditCard, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Apex Academy</span>
              <span className="block text-xs text-slate-500 font-medium">Tuition Management System</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                href={
                  user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                    ? "/admin/dashboard"
                    : user.role === "FACULTY"
                    ? "/faculty/dashboard"
                    : "/student/dashboard"
                }
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition shadow-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition shadow-sm shadow-indigo-100"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <span>Production-Ready Multi-Role Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              A Unified Educational Platform for{" "}
              <span className="text-indigo-600">Institutes, Teachers & Students</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              Integrated administrative controls, attendance verification, homework pipelines, fee ledgering,
              and cross-platform Expo mobile experiences powered by FastAPI and PostgreSQL.
            </p>

            {/* Role Gateway Cards */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Admin Card */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Admin Portal</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Institute-wide control over student onboarding, faculty workloads, fee plans, automated receipts, and batch timetables.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/login?role=admin"
                    className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700"
                  >
                    <span>Enter as Admin</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>

              {/* Faculty Card */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Faculty Workspace</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    One-click attendance roll calls, homework distribution, student review workflows, and exam scorecard entry.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/login?role=faculty"
                    className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>Enter as Faculty</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>

              {/* Student Card */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Student Portal</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Personalized timetable, attendance percentages, homework submissions, published examination results, and PDF fee receipts.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/login?role=student"
                    className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <span>Enter as Student</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Test Credentials Helper */}
            <div className="mt-12 bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-lg text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-semibold text-sm text-slate-200">Demonstration Credentials (Seeded Data)</span>
                </div>
                <span className="text-xs bg-slate-800 px-2.5 py-1 rounded text-slate-400 font-mono">Development Mode</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">Admin</p>
                  <p className="text-indigo-300">admin@apexacademy.com</p>
                  <p className="text-slate-300 mt-1">Admin@123</p>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">Faculty</p>
                  <p className="text-blue-300">prof.sharma@apexacademy.com</p>
                  <p className="text-slate-300 mt-1">Faculty@123</p>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">Student</p>
                  <p className="text-emerald-300">aarav.patel@student.com</p>
                  <p className="text-slate-300 mt-1">Student@123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          Tuition Management System • Built with FastAPI, Next.js 14, Expo & Supabase PostgreSQL
        </div>
      </footer>
    </div>
  );
}
