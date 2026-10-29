"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Calendar, AlertCircle, Loader2, X, Send } from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { Announcement, AudienceType } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState<AudienceType>("ALL");
  const [priority, setPriority] = useState("NORMAL");
  const [modalError, setModalError] = useState<string | null>(null);

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["admin-announcements"],
    queryFn: () => apiClient.get<Announcement[]>("/announcements"),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post<Announcement>("/announcements", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      setIsModalOpen(false);
      setTitle("");
      setContent("");
    },
    onError: (err: any) => setModalError(err?.message || "Failed to publish announcement"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Announcements & Notices</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Broadcast critical updates, holiday calendars, and academic notices.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Post Announcement</span>
          </button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading announcements...</div>
          ) : !announcements?.length ? (
            <div className="text-center py-12 text-slate-500">No announcements posted.</div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="bg-white border rounded-2xl p-6 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                        a.priority === "HIGH"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
                      <span className="text-xs text-slate-400">
                        Published by {a.created_by_name || "Administration"} on {formatDate(a.published_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      Audience: {a.target_audience}
                    </span>
                    {a.priority === "HIGH" && (
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {a.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-1">New Announcement</h2>
              <p className="text-xs text-slate-500 mb-4">
                Will be delivered to target users on web and mobile notification center.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createAnnouncementMutation.mutate({
                    title,
                    content,
                    target_audience: targetAudience,
                    priority,
                  });
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Schedule for Special Doubt Clinics"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as AudienceType)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">Everyone (All)</option>
                      <option value="STUDENTS">Students Only</option>
                      <option value="FACULTY">Faculty Members Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High / Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notice Content *</label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type the message details here..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAnnouncementMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Publish Now</span>
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
