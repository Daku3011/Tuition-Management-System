import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getStoredUser, clearSession } from "@/services/api";

export default function FacultyProfileScreen() {
  const router = useRouter();

  const userQuery = useQuery({
    queryKey: ["current_user"],
    queryFn: getStoredUser,
  });

  const user = userQuery.data;

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of your faculty account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.profile?.first_name?.[0] || "F").toUpperCase()}
          </Text>
        </View>
        <Text style={styles.fullName}>
          {user?.profile?.first_name || "Prof. Rajesh"} {user?.profile?.last_name || "Sharma"}
        </Text>
        <Text style={styles.email}>{user?.email || "prof.sharma@apexacademy.com"}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Faculty Member</Text>
        </View>
      </View>

      {/* Faculty Details */}
      <Text style={styles.sectionHeader}>Faculty Staff Record</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Employee Code</Text>
          <Text style={styles.infoValue}>FAC-2024-001</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>Physics & Applied Sciences</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Designation</Text>
          <Text style={styles.infoValue}>Senior Lecturer</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Work Phone</Text>
          <Text style={styles.infoValue}>+91 98111 22334</Text>
        </View>
      </View>

      {/* Teaching Assignment Summary */}
      <Text style={styles.sectionHeader}>Teaching Load</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Subjects</Text>
          <Text style={styles.infoValue}>Physics (Gr 11 & Gr 12)</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Weekly Lecture Hours</Text>
          <Text style={styles.infoValue}>18 Hours / week</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Primary Classroom</Text>
          <Text style={styles.infoValue}>Room 101-A (Physics Lab)</Text>
        </View>
      </View>

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutBtnText}>Sign Out of Faculty Desk</Text>
      </TouchableOpacity>

      <Text style={styles.versionFooter}>
        Apex TMS Mobile v1.0.0 • Connected to Secure Cloud
      </Text>
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
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#0284c7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
  },
  fullName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  email: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369a1",
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  separator: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginTop: 10,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "700",
  },
  versionFooter: {
    textAlign: "center",
    fontSize: 11,
    color: "#94a3b8",
  },
});
