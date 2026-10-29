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
import { User, StudentAttendanceSummary, Announcement } from "@tms/shared-types";

export default function StudentDashboard() {
  const router = useRouter();

  const userQuery = useQuery({
    queryKey: ["current_user"],
    queryFn: getStoredUser,
  });

  const attendanceQuery = useQuery({
    queryKey: ["student_attendance_summary"],
    queryFn: () => mobileApiRequest<StudentAttendanceSummary>("/attendance/my-summary"),
  });

  const announcementsQuery = useQuery({
    queryKey: ["announcements"],
    queryFn: () => mobileApiRequest<Announcement[]>("/announcements?limit=3"),
  });

  const isRefreshing = attendanceQuery.isRefetching || announcementsQuery.isRefetching;

  const onRefresh = () => {
    attendanceQuery.refetch();
    announcementsQuery.refetch();
  };

  const att = attendanceQuery.data;
  const percentage = att?.attendance_percentage ?? 88.5;
  const isGoodAttendance = percentage >= 75;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#4f46e5"]} />
      }
    >
      {/* Welcome Banner */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTextGroup}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.studentName}>
            {userQuery.data?.profile?.first_name || "Student"} {userQuery.data?.profile?.last_name || ""}
          </Text>
          <Text style={styles.subGreeting}>Batch: Grade 12 - Physics & Math Elite</Text>
        </View>
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarInitial}>
            {(userQuery.data?.profile?.first_name?.[0] || "S").toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Attendance Metric Card */}
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricTitle}>Overall Attendance</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isGoodAttendance ? "#ecfdf5" : "#fef2f2" },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isGoodAttendance ? "#059669" : "#dc2626" },
              ]}
            >
              {isGoodAttendance ? "Eligible" : "Low Attendance"}
            </Text>
          </View>
        </View>

        <View style={styles.attendanceRow}>
          <View>
            <Text style={styles.percentText}>{percentage}%</Text>
            <Text style={styles.statSub}>
              {att?.attended_classes ?? 18} of {att?.total_classes ?? 20} sessions present
            </Text>
          </View>
          <View style={styles.progressCircleStub}>
            <Ionicons
              name={isGoodAttendance ? "checkmark-circle" : "alert-circle"}
              size={48}
              color={isGoodAttendance ? "#10b981" : "#ef4444"}
            />
          </View>
        </View>

        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isGoodAttendance ? "#10b981" : "#ef4444",
              },
            ]}
          />
        </View>
      </View>

      {/* Today's Schedule Card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Next Session</Text>
        <TouchableOpacity onPress={() => router.push("/(student)/timetable")}>
          <Text style={styles.seeAllText}>Full Schedule</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.classCard}>
        <View style={styles.timeTag}>
          <Text style={styles.timeTagText}>04:00 PM</Text>
          <Text style={styles.durationText}>90 mins</Text>
        </View>
        <View style={styles.classDetails}>
          <Text style={styles.subjectName}>Advanced Physics: Mechanics</Text>
          <Text style={styles.facultyName}>Prof. Sharma • Room 101-A</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>Starts in 45 mins</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Shortcuts</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => router.push("/(student)/homework")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#e0e7ff" }]}>
            <Ionicons name="document-text" size={24} color="#4338ca" />
          </View>
          <Text style={styles.gridLabel}>Homework</Text>
          <Text style={styles.gridSub}>2 Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => router.push("/(student)/fees")}
        >
          <View style={[styles.iconBox, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="card" size={24} color="#d97706" />
          </View>
          <Text style={styles.gridLabel}>Fee Ledger</Text>
          <Text style={styles.gridSub}>View Receipts</Text>
        </TouchableOpacity>
      </View>

      {/* Latest Announcements */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Institute Notices</Text>
      </View>

      {announcementsQuery.isLoading ? (
        <ActivityIndicator color="#4f46e5" style={{ marginVertical: 12 }} />
      ) : (announcementsQuery.data?.length ?? 0) === 0 ? (
        <Text style={styles.emptyText}>No new announcements right now.</Text>
      ) : (
        announcementsQuery.data?.map((ann) => (
          <View key={ann.id} style={styles.noticeCard}>
            <View style={styles.noticeDot} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>{ann.title}</Text>
              <Text style={styles.noticeBody} numberOfLines={2}>
                {ann.content}
              </Text>
              <Text style={styles.noticeDate}>
                {new Date(ann.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
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
  welcomeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTextGroup: {
    flex: 1,
  },
  greeting: {
    color: "#c7d2fe",
    fontSize: 13,
    fontWeight: "500",
  },
  studentName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  subGreeting: {
    color: "#e0e7ff",
    fontSize: 12,
    marginTop: 4,
  },
  avatarBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  percentText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
  },
  statSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  progressCircleStub: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  seeAllText: {
    fontSize: 13,
    color: "#4f46e5",
    fontWeight: "600",
  },
  classCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  timeTag: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginRight: 14,
    minWidth: 70,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d4ed8",
  },
  durationText: {
    fontSize: 10,
    color: "#60a5fa",
    marginTop: 2,
  },
  classDetails: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  facultyName: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  gridItem: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  gridSub: {
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
    backgroundColor: "#4f46e5",
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
  noticeDate: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#94a3b8",
    fontStyle: "italic",
    marginVertical: 8,
  },
});
