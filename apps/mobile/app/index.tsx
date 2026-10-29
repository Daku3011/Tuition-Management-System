import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { getStoredToken, getStoredUser } from "@/services/api";

export default function EntryScreen() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getStoredToken();
        const user = await getStoredUser();

        if (token && user) {
          if (user.role === "FACULTY") {
            router.replace("/(faculty)");
            return;
          } else if (user.role === "STUDENT") {
            router.replace("/(student)");
            return;
          }
        }
        router.replace("/(auth)/login");
      } catch {
        router.replace("/(auth)/login");
      }
    }

    checkAuth();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text style={styles.text}>Loading Apex Tuition Platform...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
});
