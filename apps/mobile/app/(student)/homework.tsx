import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { mobileApiRequest } from "@/services/api";
import { Assignment } from "@tms/shared-types";

export default function StudentHomeworkScreen() {
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "SUBMITTED">("ALL");

  const assignmentsQuery = useQuery({
    queryKey: ["student_assignments"],
    queryFn: () => mobileApiRequest<Assignment[]>("/assignments"),
  });

  const assignments = assignmentsQuery.data || [];

  const handleSimulateSubmit = (id: string, title: string) => {
    Alert.alert(
      "Submit Assignment",
      `Would you like to mark "${title}" as submitted with your solution file?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Submit",
          onPress: () => {
            Alert.alert("Success", "Your homework has been submitted for grading.");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {(["ALL", "PENDING", "SUBMITTED"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab === "ALL" ? "All Tasks" : tab === "PENDING" ? "Pending" : "Submitted"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {assignmentsQuery.isLoading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : assignments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No assignments found</Text>
            <Text style={styles.emptySub}>You have no assigned tasks in this view.</Text>
          </View>
        ) : (
          assignments.map((item, idx) => {
            const isDueSoon = idx === 0;
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectBadgeText}>Physics</Text>
                  </View>
                  <View
                    style={[
                      styles.dueBadge,
                      { backgroundColor: isDueSoon ? "#fff1f2" : "#f1f5f9" },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={isDueSoon ? "#e11d48" : "#64748b"}
                    />
                    <Text
                      style={[
                        styles.dueBadgeText,
                        { color: isDueSoon ? "#e11d48" : "#64748b" },
                      ]}
                    >
                      {new Date(item.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {item.description || "Solve the attached exercises and upload work steps."}
                </Text>

                <View style={styles.footerRow}>
                  <Text style={styles.maxMarks}>Max Points: {item.max_marks}</Text>
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={() => handleSimulateSubmit(item.id, item.title)}
                  >
                    <Text style={styles.submitBtnText}>Submit Work</Text>
                    <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#4f46e5",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectBadge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4338ca",
  },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  maxMarks: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
});
