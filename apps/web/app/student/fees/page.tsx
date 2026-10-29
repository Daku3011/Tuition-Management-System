"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Loader2,
} from "lucide-react";
import { StudentLayout } from "@/components/layouts/student-layout";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { StudentFeeAssignment, Payment } from "@tms/shared-types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function StudentFeesPage() {
  const { user } = useAuth();

  const { data: feeLedgers, isLoading } = useQuery<StudentFeeAssignment[]>({
    queryKey: ["student-fee-ledger-view"],
    queryFn: async () => {
      const studentProfile = await apiClient.get<any>("/students?limit=100");
      const currentStudent = studentProfile?.items?.find((s: any) => s.user?.id === user?.id);
      if (!currentStudent) return [];
      return apiClient.get<StudentFeeAssignment[]>(`/fees/student/${currentStudent.id}`);
    },
    enabled: !!user,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["student-payments-view"],
    queryFn: () => apiClient.get<Payment[]>("/fees/payments"),
  });

  const handleDownloadReceipt = (receiptNumber: string) => {
    const url = apiClient.getDownloadUrl(`/fees/receipts/${receiptNumber}/pdf`);
    window.open(url, "_blank");
  };

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tuition Fees & Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review fee schedule, payment status, and download tax/payment receipts.
          </p>
        </div>

        {/* Ledger Summary */}
        {feeLedgers?.map((ledger) => (
          <div key={ledger.id} className="bg-white border rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Assigned Tuition Structure
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{ledger.fee_plan_name}</h3>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Program Fee</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatCurrency(ledger.net_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Outstanding Due</span>
                  <span className="font-extrabold text-amber-600 text-sm">
                    {formatCurrency(ledger.balance_due)}
                  </span>
                </div>
              </div>
            </div>

            {/* Installments Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Installment Schedule
              </h4>
              <div className="space-y-2">
                {ledger.installments.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        Installment #{inst.installment_number}
                      </span>
                      <span className="text-slate-500 ml-2">Due by {formatDate(inst.due_date)}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-800">
                        {formatCurrency(inst.amount)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inst.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : inst.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inst.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Payment History & Receipts */}
        <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Payment Receipts & Tax Invoices
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white border-b text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-4">Receipt No.</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Amount Paid</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4 text-right">Download Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!payments?.length ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No payment receipts on record.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {p.receipt_number || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(p.payment_date)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.payment_method}</td>
                      <td className="py-3 px-4 text-right">
                        {p.receipt_number && (
                          <button
                            onClick={() => handleDownloadReceipt(p.receipt_number!)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-semibold text-[11px] transition"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Download PDF</span>
                          </button>
                        )}
                      </td>
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
