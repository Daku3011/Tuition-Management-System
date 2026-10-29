"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck, User, Clock, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { AuditLog } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["admin-audit-logs"],
    queryFn: () => apiClient.get<AuditLog[]>("/audit-logs?limit=50"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system logs capturing administrative operations, payment creation, and attendance corrections.
          </p>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading audit events...
                    </td>
                  </tr>
                ) : !logs?.length ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{log.user_name || "System"}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{log.entity_type}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px] max-w-md truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
