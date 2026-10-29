"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Receipt,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Loader2,
  X,
  Search,
} from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { FeePlan, Payment, Student, PaymentMethod, StudentFeeAssignment } from "@tms/shared-types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminFeesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"payments" | "plans">("payments");
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);

  // Form states for record payment
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedFeeAssignId, setSelectedFeeAssignId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number>(15000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch payments
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["admin-payments"],
    queryFn: () => apiClient.get<Payment[]>("/fees/payments"),
  });

  // Fetch fee plans
  const { data: feePlans, isLoading: plansLoading } = useQuery<FeePlan[]>({
    queryKey: ["admin-fee-plans"],
    queryFn: () => apiClient.get<FeePlan[]>("/fees/plans"),
  });

  // Fetch students for selector
  const { data: studentsData } = useQuery<any>({
    queryKey: ["admin-students-simple"],
    queryFn: () => apiClient.get<any>("/students?limit=100"),
  });

  // Fetch selected student's fee assignments
  const { data: studentFeeAssignments } = useQuery<StudentFeeAssignment[]>({
    queryKey: ["student-fee-assignments", selectedStudentId],
    queryFn: () => apiClient.get<StudentFeeAssignment[]>(`/fees/student/${selectedStudentId}`),
    enabled: !!selectedStudentId,
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post<Payment>("/fees/payments", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setIsRecordPaymentModalOpen(false);
      setSelectedStudentId("");
      setSelectedFeeAssignId("");
      setTransactionRef("");
    },
    onError: (err: any) => setModalError(err?.message || "Failed to record payment"),
  });

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedStudentId || !selectedFeeAssignId) {
      setModalError("Please select student and active fee assignment");
      return;
    }

    recordPaymentMutation.mutate({
      student_id: selectedStudentId,
      fee_assignment_id: selectedFeeAssignId,
      amount: Number(paymentAmount),
      payment_method: paymentMethod,
      transaction_reference: transactionRef || undefined,
      notes: paymentNotes || undefined,
    });
  };

  const handleExportCsv = () => {
    const url = apiClient.getDownloadUrl("/reports/fee-collection-export");
    window.open(url, "_blank");
  };

  const handleDownloadPdfReceipt = (receiptNumber: string) => {
    const url = apiClient.getDownloadUrl(`/fees/receipts/${receiptNumber}/pdf`);
    window.open(url, "_blank");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial & Fee Operations</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tuition fee plans, payment collections, and verified PDF receipts.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsRecordPaymentModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
            >
              <Receipt className="h-4 w-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b text-xs font-semibold space-x-4">
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === "payments"
                ? "border-emerald-600 text-emerald-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Payment Transactions & Receipts ({payments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === "plans"
                ? "border-emerald-600 text-emerald-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Fee Structure Plans ({feePlans?.length || 0})
          </button>
        </div>

        {activeTab === "payments" ? (
          /* Payments Table */
          <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt No.</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">PDF Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading payment records...
                      </td>
                    </tr>
                  ) : !payments?.length ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {p.receipt_number || "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{p.student_name}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600 text-sm">
                          {formatCurrency(p.amount, p.currency)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {p.transaction_reference || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(p.payment_date)}</td>
                        <td className="py-3 px-4 text-right">
                          {p.receipt_number && (
                            <button
                              onClick={() => handleDownloadPdfReceipt(p.receipt_number!)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-semibold text-[11px] transition"
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
        ) : (
          /* Fee Plans List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plansLoading ? (
              <div className="col-span-3 text-center py-12 text-slate-400">Loading fee plans...</div>
            ) : (
              feePlans?.map((plan) => (
                <div key={plan.id} className="bg-white border rounded-2xl p-5 shadow-2xs">
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    {plan.course_name}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-2">{plan.description || "General Fee Plan"}</p>

                  <div className="mt-4 pt-3 border-t flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Total Program Fee</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {formatCurrency(plan.total_amount, plan.currency)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {plan.installments_count} Installments
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Record Payment Modal */}
        {isRecordPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsRecordPaymentModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-1">Record Fee Payment</h2>
              <p className="text-xs text-slate-500 mb-4">
                Record payment allocation against student installment and issue receipt.
              </p>

              {modalError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Student *</label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setSelectedFeeAssignId("");
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Student --</option>
                    {studentsData?.items?.map((s: Student) => (
                      <option key={s.id} value={s.id}>
                        {s.user?.profile?.full_name} ({s.student_id_code})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudentId && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Applicable Fee Plan / Ledger *
                    </label>
                    <select
                      required
                      value={selectedFeeAssignId}
                      onChange={(e) => {
                        setSelectedFeeAssignId(e.target.value);
                        const fa = studentFeeAssignments?.find((item) => item.id === e.target.value);
                        if (fa && fa.installments.length > 0) {
                          const firstPending = fa.installments.find((i) => i.status !== "PAID");
                          if (firstPending) {
                            setPaymentAmount(firstPending.remaining_balance);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Assigned Plan --</option>
                      {studentFeeAssignments?.map((fa) => (
                        <option key={fa.id} value={fa.id}>
                          {fa.fee_plan_name} • Due: ₹{fa.balance_due.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Amount (INR) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="CASH">Cash Deposit</option>
                      <option value="ONLINE">Online Card / Gateway</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction / Bank Reference No.
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI-294029410 or CHQ-001249"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsRecordPaymentModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordPaymentMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {recordPaymentMutation.isPending ? "Issuing Receipt..." : "Confirm & Issue Receipt"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
