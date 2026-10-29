"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, PlusCircle, CheckCircle2, Loader2, AlertCircle, X } from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiClient } from "@/lib/api-client";
import { Course } from "@tms/shared-types";

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["admin-courses"],
    queryFn: () => apiClient.get<Course[]>("/courses"),
  });

  const createCourseMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post<Course>("/courses", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setIsAddCourseModalOpen(false);
      setCourseName("");
      setCourseCode("");
      setCourseDescription("");
    },
    onError: (err: any) => setModalError(err?.message || "Failed to create course"),
  });

  const addSubjectMutation = useMutation({
    mutationFn: ({ courseId, payload }: any) =>
      apiClient.post(`/courses/${courseId}/subjects`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setIsAddSubjectModalOpen(false);
      setSubjectName("");
      setSubjectCode("");
    },
    onError: (err: any) => setModalError(err?.message || "Failed to add subject"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Courses & Curriculum</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Define academic programs, syllabus subjects, and fee associations.
            </p>
          </div>
          <button
            onClick={() => setIsAddCourseModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Course</span>
          </button>
        </div>

        {/* Courses List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-2 text-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading courses...
            </div>
          ) : (
            courses?.map((course) => (
              <div key={course.id} className="bg-white border rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{course.name}</h3>
                      <span className="text-xs font-mono font-semibold text-indigo-600">{course.code}</span>
                    </div>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      Active
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2">{course.description || "No description provided."}</p>

                  <div className="mt-5 border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Subjects ({course.subjects.length})
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setIsAddSubjectModalOpen(true);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center space-x-1"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Add Subject</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {course.subjects.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                        >
                          <span className="font-medium text-slate-800">{s.name}</span>
                          <span className="font-mono text-slate-500 font-semibold">{s.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Course Modal */}
        {isAddCourseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-1">Create Course Program</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createCourseMutation.mutate({
                    name: courseName,
                    code: courseCode,
                    description: courseDescription,
                  });
                }}
                className="space-y-4 text-xs mt-4"
              >
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Class 11 IIT-JEE Intensive"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="JEE-11-INT"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCourseModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                  >
                    Save Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Subject Modal */}
        {isAddSubjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
              <button
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-1">Add Subject</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addSubjectMutation.mutate({
                    courseId: selectedCourseId,
                    payload: { name: subjectName, code: subjectCode },
                  });
                }}
                className="space-y-4 text-xs mt-4"
              >
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Organic Chemistry"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="CHEM-ORG"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                  >
                    Add Subject
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
