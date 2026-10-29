"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  React.useEffect(() => {
    if (roleParam === "admin") {
      setEmail("admin@apexacademy.com");
      setPassword("Admin@123");
    } else if (roleParam === "faculty") {
      setEmail("prof.sharma@apexacademy.com");
      setPassword("Faculty@123");
    } else if (roleParam === "student") {
      setEmail("aarav.patel@student.com");
      setPassword("Student@123");
    }
  }, [roleParam]);

  const handleQuickFill = (role: "admin" | "faculty" | "student") => {
    setError(null);
    if (role === "admin") {
      setEmail("admin@apexacademy.com");
      setPassword("Admin@123");
    } else if (role === "faculty") {
      setEmail("prof.sharma@apexacademy.com");
      setPassword("Faculty@123");
    } else {
      setEmail("aarav.patel@student.com");
      setPassword("Student@123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 mb-3">
          <GraduationCap className="h-7 w-7" />
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="mt-2 text-sm text-slate-500">
          Select your role or enter your credentials
        </p>
      </div>

      {/* Quick Fill Role Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => handleQuickFill("admin")}
          className="py-1.5 rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-xs transition"
        >
          Admin Demo
        </button>
        <button
          type="button"
          onClick={() => handleQuickFill("faculty")}
          className="py-1.5 rounded-lg hover:bg-white hover:text-blue-600 hover:shadow-xs transition"
        >
          Faculty Demo
        </button>
        <button
          type="button"
          onClick={() => handleQuickFill("student")}
          className="py-1.5 rounded-lg hover:bg-white hover:text-emerald-600 hover:shadow-xs transition"
        >
          Student Demo
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start space-x-2 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@apexacademy.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-900 transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-900 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </div>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-500">
          Have an onboarding invitation?{" "}
          <Link href="/accept-invitation" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Set password here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center text-slate-400">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
