"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Loader2, Users, BookOpen } from "lucide-react";
import { FacultyLayout } from "@/components/layouts/faculty-layout";
import { apiClient } from "@/lib/api-client";
import { ClassSession } from "@tms/shared-types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function FacultyTimetablePage() {
  const [selectedDay, setSelectedDay] = useState<number | "ALL">("ALL");

  const { data: sessions, isLoading } = useQuery<ClassSession[]>({
    queryKey: ["faculty-timetable"],
    queryFn: () => apiClient.get<ClassSession[]>("/timetable"),
  });

  const filteredSessions = sessions?.filter((s) =>
    selectedDay === "ALL" ? true : s.day_of_week === selectedDay
  ) || [];

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Teaching Timetable</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Your weekly classroom lectures, laboratory sessions, and room schedules.
            </p>
          </div>

          {/* Day Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
            <button
              onClick={() => setSelectedDay("ALL")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedDay === "ALL"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Days
            </button>
            {DAYS.slice(0, 6).map((dayName, idx) => (
              <button
                key={dayName}
                onClick={() => setSelectedDay(idx)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  selectedDay === idx
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {dayName.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Timetable Card Table */}
        <div className="bg-white border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Assigned Batch</th>
                  <th className="py-3 px-4">Room / Facility</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading your teaching schedule...
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No lecture sessions scheduled</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedDay === "ALL"
                          ? "You currently have no class sessions assigned."
                          : "No classes scheduled on this day."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {DAYS[s.day_of_week] || `Day ${s.day_of_week}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          <Clock className="h-3 w-3" />
                          <span>
                            {s.start_time} - {s.end_time}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                          <span>{s.subject_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <div className="flex items-center space-x-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>{s.batch_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{s.room_or_link || "Room 101"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                            s.is_cancelled
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {s.is_cancelled ? "Cancelled" : "Scheduled"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
}
