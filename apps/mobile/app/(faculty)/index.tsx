import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { mobileApiRequest, getStoredUser } from "@/services/api";
import { Batch, Announcement } from "@tms/shared-types";

export default function FacultyDashboard() {
  const router = useRouter();

  const userQuery = useQuery({
    queryKey: ["current_user"],
    queryFn: getStoredUser,
  });

  const batchesQuery = useQuery({
    queryKey: ["faculty_batches"],
    queryFn: () => mobileApiRequest<Batch[]>("/batches"),
  });

  const announcementsQuery = useQuery({
    queryKey: ["announcements"],
    queryFn: () => mobileApiRequest<Announcement[]>("/announcements?limit=3"),
  });

  const isRefreshing = batchesQuery.isRefetching || announcementsQuery.isRefetching;

  const onRefresh = () => {
    batchesQuery.refetch();
    announcementsQuery.refetch();
  };

  const batches = batchesQuery.data || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#0284c7"]} />
      }
    >
      {/* Faculty Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroText}>
          <Text style={styles.heroGreeting}>Faculty Dashboard</Text>
          <Text style={styles.heroName}>
            {userQuery.data?.profile?.first_name || "Prof."} {userQuery.data?.profile?.last_name || "Sharma"}
          </Text>
          <Text style={styles.heroDept}>Senior Lecturer • Department of Physics</Text>
        </View>
        <View style={styles.heroBadge}>
          <Ionicons name="school" size={28} color="#ffffff" />
        </View>
      </View>

      {/* Today's Up Next Lecture */}
      <View style={styles.nextLectureCard}>
        <View style={styles.lectureBadge}>
          <Text style={styles.lectureBadgeText}>NEXT UP • 04:00 PM</Text>
        </View>
        <Text style={styles.lectureTitle}>Advanced Mechanics & Thermodynamics</Text>
        <Text style={styles.lectureMeta}>Batch 12-A • Room 101-A • 28 Students enrolled</Text>

        <TouchableOpacity
          style={styles.takeAttendanceBtn}
          onPress={() => router.push("/(faculty)/attendance")}
        >
          <Ionicons name="checkbox" size={18} color="#ffffff" />
          <Text style={styles.takeAttendanceBtnText}>Take Live Attendance</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconBox, { backgroundColor: "#e0f2fe" }]}>
            <Ionicons name="people" size={20} color="#0284c7" />
          </View>
          <Text style={styles.metricValue}>{batches.length || 2}</Text>
          <Text style={styles.metricLabel}>Assigned Batches</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconBox, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="document-text" size={20} color="#d97706" />
          </View>
          <Text style={styles.metricValue}>14</Text>
          <Text style={styles.metricLabel}>Submissions to Grade</Text>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Teaching Management</Text>
      </View>

      <TouchableOpacity
        style={styles.actionRow}
        onPress={() => router.push("/(faculty)/classes")}
      >
        <View style={[styles.actionIcon, { backgroundColor: "#ecfdf5" }]}>
          <Ionicons name="calendar" size={20} color="#059669" />
        </View>
        <View style={styles.actionDetails}>
          <Text style={styles.actionTitle}>Batch Rosters & Schedule</Text>
          <Text style={styles.actionSub}>View student rosters and timetable</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionRow}
        onPress={() => router.push("/(faculty)/assignments")}
      >
        <View style={[styles.actionIcon, { backgroundColor: "#f5f3ff" }]}>
          <Ionicons name="book" size={20} color="#7c3aed" />
        </View>
        <View style={styles.actionDetails}>
          <Text style={styles.actionTitle}>Homework & Study Materials</Text>
          <Text style={styles.actionSub}>Assign tasks and upload lecture notes</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </TouchableOpacity>

      {/* Announcements */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Institute Noticeboard</Text>
      </View>

      {announcementsQuery.isLoading ? (
        <ActivityIndicator color="#0284c7" style={{ marginVertical: 12 }} />
      ) : (
        announcementsQuery.data?.map((ann) => (
          <View key={ann.id} style={styles.noticeCard}>
            <View style={styles.noticeDot} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>{ann.title}</Text>
              <Text style={styles.noticeBody} numberOfLines={2}>
                {ann.content}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0369a1",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0369a1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroText: {
    flex: 1,
  },
  heroGreeting: {
    color: "#bae6fd",
    fontSize: 13,
    fontWeight: "600",
  },
  heroName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  heroDept: {
    color: "#e0f2fe",
    fontSize: 12,
    marginTop: 4,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  nextLectureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  lectureBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  lectureBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0369a1",
  },
  lectureTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  lectureMeta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 14,
  },
  takeAttendanceBtn: {
    flexDirection: "row",
    backgroundColor: "#0284c7",
    borderRadius: 10,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  takeAttendanceBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  metricLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  actionRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionDetails: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  actionSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  noticeCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "flex-start",
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0284c7",
    marginTop: 5,
    marginRight: 10,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  noticeBody: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
});
