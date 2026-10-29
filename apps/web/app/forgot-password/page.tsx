"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.post<any>("/auth/forgot-password", { email });
      setSuccess(true);
      if (res?.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process password reset request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 mb-3">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Forgot Password</h2>
          <p className="mt-2 text-xs text-slate-500">
            Enter your registered email address and we'll dispatch a secure recovery token.
          </p>
        </div>

        {success ? (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Reset Instructions Dispatched</span>
              </div>
              <p>Check your email for the recovery link.</p>
            </div>

            {resetToken && (
              <div className="p-3 bg-slate-100 border rounded-lg text-xs font-mono break-all">
                <span className="text-slate-500 block mb-1 font-sans font-bold">
                  Development Mode Reset Token:
                </span>
                {resetToken}
              </div>
            )}

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                ← Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@apexacademy.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Dispatch Recovery Link</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-slate-500 hover:text-slate-700 font-semibold inline-flex items-center space-x-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
