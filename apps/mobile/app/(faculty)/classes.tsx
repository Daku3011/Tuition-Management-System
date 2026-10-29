import React from "react";
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
import { Batch } from "@tms/shared-types";

export default function FacultyClassesScreen() {
  const batchesQuery = useQuery({
    queryKey: ["faculty_batches"],
    queryFn: () => mobileApiRequest<Batch[]>("/batches"),
  });

  const batches = batchesQuery.data || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerSubtitle}>
        Your assigned academic cohorts for the current term.
      </Text>

      {batchesQuery.isLoading ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
      ) : batches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No batches assigned</Text>
        </View>
      ) : (
        batches.map((b) => (
          <View key={b.id} style={styles.batchCard}>
            <View style={styles.batchTop}>
              <View>
                <Text style={styles.batchName}>{b.name}</Text>
                <Text style={styles.batchCode}>Code: {b.code}</Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="people" size={16} color="#0284c7" />
                <Text style={styles.statText}>
                  {b.enrolled_count} / {b.capacity} Students
                </Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                <Text style={styles.statText}>Mon, Wed, Fri</Text>
              </View>
            </View>

            <View style={styles.roomRow}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
              <Text style={styles.roomText}>{b.room_number || "Main Lecture Hall 101"}</Text>
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
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },
  batchCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  batchTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  batchName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  batchCode: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  activePill: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  roomText: {
    fontSize: 12,
    color: "#64748b",
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
});
