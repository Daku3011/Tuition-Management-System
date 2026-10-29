import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { mobileApiRequest } from "@/services/api";
import { ClassSession } from "@tms/shared-types";

const DAYS = [
  { key: "MON", label: "Mon" },
  { key: "TUE", label: "Tue" },
  { key: "WED", label: "Wed" },
  { key: "THU", label: "Thu" },
  { key: "FRI", label: "Fri" },
  { key: "SAT", label: "Sat" },
];

export default function StudentTimetableScreen() {
  const [selectedDay, setSelectedDay] = useState("MON");

  const timetableQuery = useQuery({
    queryKey: ["student_timetable"],
    queryFn: () => mobileApiRequest<ClassSession[]>("/timetable/my-schedule"),
  });

  const sessions = timetableQuery.data || [];

  return (
    <View style={styles.container}>
      {/* Day Selector Pills */}
      <View style={styles.dayPickerContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
          {DAYS.map((d) => {
            const isSelected = selectedDay === d.key;
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.dayPill, isSelected && styles.dayPillActive]}
                onPress={() => setSelectedDay(d.key)}
              >
                <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Schedule Feed */}
      <ScrollView contentContainerStyle={styles.scheduleList}>
        {timetableQuery.isLoading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.sessionCard}>
              <View style={styles.timeColumn}>
                <Text style={styles.startTime}>04:00 PM</Text>
                <Text style={styles.endTime}>05:30 PM</Text>
                <View style={styles.dotLine} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.subjectRow}>
                  <Text style={styles.subjectTitle}>Physics: Mechanics & Optics</Text>
                  <View style={styles.roomTag}>
                    <Text style={styles.roomTagText}>Room 101-A</Text>
                  </View>
                </View>
                <Text style={styles.batchName}>Grade 12 - Regular Batch</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="person-circle-outline" size={16} color="#64748b" />
                  <Text style={styles.facultyText}>Prof. Sharma</Text>
                </View>
              </View>
            </View>

            <View style={styles.sessionCard}>
              <View style={styles.timeColumn}>
                <Text style={styles.startTime}>05:45 PM</Text>
                <Text style={styles.endTime}>07:15 PM</Text>
                <View style={styles.dotLine} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.subjectRow}>
                  <Text style={styles.subjectTitle}>Mathematics: Calculus II</Text>
                  <View style={styles.roomTag}>
                    <Text style={styles.roomTagText}>Room 204</Text>
                  </View>
                </View>
                <Text style={styles.batchName}>Grade 12 - Regular Batch</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="person-circle-outline" size={16} color="#64748b" />
                  <Text style={styles.facultyText}>Dr. Verma</Text>
                </View>
              </View>
            </View>

            <View style={styles.emptyNote}>
              <Ionicons name="information-circle-outline" size={18} color="#94a3b8" />
              <Text style={styles.emptyNoteText}>
                No more sessions scheduled for this day.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  dayPickerContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  dayScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  dayPillActive: {
    backgroundColor: "#4f46e5",
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  dayPillTextActive: {
    color: "#ffffff",
  },
  scheduleList: {
    padding: 16,
  },
  sessionCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timeColumn: {
    width: 76,
    alignItems: "center",
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: "#f1f5f9",
  },
  startTime: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  endTime: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  dotLine: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4f46e5",
    marginTop: 10,
  },
  cardContent: {
    flex: 1,
    paddingLeft: 12,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  subjectTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  roomTag: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  roomTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16a34a",
  },
  batchName: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  facultyText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  emptyNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
  },
  emptyNoteText: {
    fontSize: 13,
    color: "#94a3b8",
  },
});
