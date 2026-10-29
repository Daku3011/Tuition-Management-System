"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Search,
  Plus,
  Mail,
  Phone,
  BookOpen,
  Award,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { Faculty, PaginatedResponse } from "@tms/shared-types";
import { formatDate } from "@/lib/utils";

export default function AdminFacultyPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("Lecturer");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const { data: facultyData, isLoading } = useQuery<PaginatedResponse<Faculty>>({
    queryKey: ["admin-faculty", search, page],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Faculty>>("/faculty", {
        search: search || undefined,
        page,
        limit: 15,
      }),
  });

  const addFacultyMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post<Faculty>("/faculty", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faculty"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setModalError(err?.message || "Failed to onboard faculty");
    },
  });

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDesignation("Lecturer");
    setQualification("");
    setSpecialization("");
    setBio("");
    setModalError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    addFacultyMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      designation,
      qualification,
      specialization,
      bio,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain instructor credentials, academic specializations, and teaching workload.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Faculty</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border flex items-center justify-between shadow-2xs">
          <div className="relative w-full max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by faculty name, code, specialization..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Faculty Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading faculty staff...
            </div>
          ) : !facultyData?.items?.length ? (
            <div className="col-span-3 text-center py-12 text-slate-500">
              No faculty members found.
            </div>
          ) : (
            facultyData.items.map((f) => {
              const fullName = f.user?.profile?.full_name || "Instructor";
              const email = f.user?.email || "No email";
              const phone = f.user?.profile?.phone || "N/A";

              return (
                <div key={f.id} className="bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                          {f.user?.profile?.first_name?.[0] || "F"}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{fullName}</h3>
                          <span className="text-[11px] font-mono text-slate-400">{f.faculty_code}</span>
                        </div>
                      </div>
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {f.status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-indigo-600 mt-3">{f.designation}</p>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      {f.specialization && (
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{f.specialization}</span>
                        </div>
                      )}
                      {f.qualification && (
                        <div className="flex items-center space-x-2">
                          <Award className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{f.qualification}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t flex items-center justify-between text-xs text-slate-500">
                    <span>{f.assigned_batches_count} Batches Assigned</span>
                    <span>{f.assigned_students_count} Active Students</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Onboard Faculty Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-1">Onboard New Faculty Member</h2>
              <p className="text-xs text-slate-500 mb-4">
                Register faculty profile and dispatch email invitation.
              </p>

              {modalError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. M.Sc. Physics"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Calculus, Organic Chemistry"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bio / Profile Notes</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-slate-50 font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addFacultyMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center space-x-2 disabled:opacity-50"
                  >
                    {addFacultyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Complete Onboarding</span>
                    )}
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
