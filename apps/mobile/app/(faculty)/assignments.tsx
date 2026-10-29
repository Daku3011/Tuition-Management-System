import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { mobileApiRequest } from "@/services/api";
import { Assignment, Batch } from "@tms/shared-types";

export default function FacultyAssignmentsScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxMarks, setMaxMarks] = useState("50");

  const assignmentsQuery = useQuery({
    queryKey: ["faculty_assignments"],
    queryFn: () => mobileApiRequest<Assignment[]>("/assignments"),
  });

  const batchesQuery = useQuery({
    queryKey: ["faculty_batches"],
    queryFn: () => mobileApiRequest<Batch[]>("/batches"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const batchId = batchesQuery.data?.[0]?.id;
      if (!batchId) throw new Error("No batch available to assign task.");

      return await mobileApiRequest<Assignment>("/assignments", {
        method: "POST",
        body: JSON.stringify({
          batch_id: batchId,
          title,
          description,
          due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
          max_marks: parseInt(maxMarks, 10) || 50,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty_assignments"] });
      setModalVisible(false);
      setTitle("");
      setDescription("");
      Alert.alert("Success", "New assignment published to student portal.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to create assignment.");
    },
  });

  const assignments = assignmentsQuery.data || [];

  return (
    <View style={styles.container}>
      {/* Top Action Header */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Active Homework ({assignments.length})</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.newBtnText}>New Task</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {assignmentsQuery.isLoading ? (
          <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
        ) : assignments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No assignments created</Text>
            <Text style={styles.emptySub}>Tap 'New Task' to publish homework to your students.</Text>
          </View>
        ) : (
          assignments.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>{item.max_marks} Pts</Text>
                </View>
              </View>

              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description || "No special instructions provided."}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#64748b" />
                  <Text style={styles.metaText}>
                    Due:{" "}
                    {new Date(item.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>

                <View style={styles.submissionPill}>
                  <Ionicons name="checkmark-done" size={14} color="#059669" />
                  <Text style={styles.submissionText}>8 Submissions</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Assignment Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Assignment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Assignment Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chapter 4 Electrostatics Problem Set"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Instructions / Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Details of problems, required steps..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Maximum Marks</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                value={maxMarks}
                onChangeText={setMaxMarks}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.publishBtn, createMutation.isPending && styles.btnDisabled]}
              onPress={() => createMutation.mutate()}
              disabled={createMutation.isPending || !title}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.publishBtnText}>Publish to Cohort</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  newBtn: {
    flexDirection: "row",
    backgroundColor: "#0284c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  newBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  pointsBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pointsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  cardDesc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#64748b",
  },
  submissionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  submissionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
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
    textAlign: "center",
    paddingHorizontal: 30,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  publishBtn: {
    backgroundColor: "#0284c7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  publishBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
