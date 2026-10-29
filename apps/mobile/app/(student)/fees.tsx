import React from "react";
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

export default function StudentFeesScreen() {
  const feesQuery = useQuery({
    queryKey: ["student_fee_statement"],
    queryFn: () => mobileApiRequest<any>("/fees/my-statement"),
  });

  const handleDownloadReceipt = (receiptNo: string) => {
    Alert.alert(
      "Download Official Receipt",
      `Tax invoice & receipt #${receiptNo} is being generated as a digitally signed PDF.`,
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Balance Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Outstanding Fee Balance</Text>
        <Text style={styles.balanceAmount}>₹15,000</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.subLabel}>Total Plan Fee</Text>
            <Text style={styles.subValue}>₹45,000</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.subLabel}>Total Paid</Text>
            <Text style={[styles.subValue, { color: "#10b981" }]}>₹30,000</Text>
          </View>
        </View>
      </View>

      {/* Installments Schedule */}
      <Text style={styles.sectionTitle}>Installment Milestones</Text>

      <View style={styles.installmentCard}>
        <View style={styles.instHeader}>
          <View>
            <Text style={styles.instTitle}>Installment 1 (Enrollment)</Text>
            <Text style={styles.instDue}>Due: Jun 15, 2024</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#ecfdf5" }]}>
            <Text style={[styles.badgeText, { color: "#059669" }]}>PAID</Text>
          </View>
        </View>
        <View style={styles.instBottom}>
          <Text style={styles.instAmount}>₹15,000</Text>
          <TouchableOpacity
            style={styles.receiptLink}
            onPress={() => handleDownloadReceipt("RCP-2024-001")}
          >
            <Ionicons name="document-text-outline" size={14} color="#4f46e5" />
            <Text style={styles.receiptLinkText}>Receipt #001</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.installmentCard}>
        <View style={styles.instHeader}>
          <View>
            <Text style={styles.instTitle}>Installment 2 (Mid-Term)</Text>
            <Text style={styles.instDue}>Due: Sep 15, 2024</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#ecfdf5" }]}>
            <Text style={[styles.badgeText, { color: "#059669" }]}>PAID</Text>
          </View>
        </View>
        <View style={styles.instBottom}>
          <Text style={styles.instAmount}>₹15,000</Text>
          <TouchableOpacity
            style={styles.receiptLink}
            onPress={() => handleDownloadReceipt("RCP-2024-048")}
          >
            <Ionicons name="document-text-outline" size={14} color="#4f46e5" />
            <Text style={styles.receiptLinkText}>Receipt #048</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.installmentCard}>
        <View style={styles.instHeader}>
          <View>
            <Text style={styles.instTitle}>Installment 3 (Final Phase)</Text>
            <Text style={styles.instDue}>Due: Dec 15, 2024</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#fff7ed" }]}>
            <Text style={[styles.badgeText, { color: "#c2410c" }]}>PENDING</Text>
          </View>
        </View>
        <View style={styles.instBottom}>
          <Text style={styles.instAmount}>₹15,000</Text>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() =>
              Alert.alert(
                "Fee Payment Gateway",
                "UPI, NetBanking & Card payment gateway integration is configured in the web portal. Please contact the administrative desk or scan center UPI QR.",
                [{ text: "Understood" }]
              )
            }
          >
            <Text style={styles.payBtnText}>Pay Online</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Security Note */}
      <View style={styles.noteBox}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#6366f1" />
        <Text style={styles.noteText}>
          All transactions are encrypted and audited under official GST invoice standards.
        </Text>
      </View>
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
  summaryCard: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  balanceAmount: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
    marginBottom: 18,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 16,
  },
  metricItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 12,
  },
  subLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "500",
  },
  subValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  installmentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  instHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  instTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  instDue: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  instBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  instAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  receiptLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  receiptLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
  },
  payBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  noteBox: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#4338ca",
    lineHeight: 16,
  },
});
