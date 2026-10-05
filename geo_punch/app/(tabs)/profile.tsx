import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { apiRequest } from "@/constants/apiRequest";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

interface User {
  name: string;
  email: string | null;
  id_card_no: string | null;
  department: string | null;
  designation: string | null;
  phone_no: string | null;
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}:</ThemedText>
      <ThemedText style={styles.value}>{value || "N/A"}</ThemedText>
    </View>
  );
}

export default function ProfileScreen() {
  const { token, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["user"],
    enabled: Boolean(token),
    queryFn: async () => {
      const result = await apiRequest<{ data: User | null }>("/geo_punch/users", {
        token,
        onUnauthorized: logout,
      });
      if (!result.data) throw new Error("Employee profile was not found.");
      return result.data;
    },
  });

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#dff3ef", dark: "#203b35" }}
      headerImage={<Image source={require("@/assets/images/Banner.jpeg")} style={styles.reactLogo} />}
    >
      <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
        Your profile
      </ThemedText>

      {isLoading ? (
        <View style={styles.stateCard} accessibilityRole="progressbar">
          <ActivityIndicator color={Colors.light.tint} />
          <ThemedText style={styles.stateText}>Loading your profile…</ThemedText>
        </View>
      ) : null}
      {error ? (
        <View style={styles.stateCard}>
          <ThemedText style={styles.stateTitle}>Couldn’t load your profile</ThemedText>
          <ThemedText style={styles.stateText}>{error.message}</ThemedText>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Try again</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      {user ? (
        <View style={styles.card}>
          <ThemedText style={styles.cardEyebrow}>EMPLOYEE PROFILE</ThemedText>
          <ThemedText style={styles.name}>{user.name}</ThemedText>
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow label="ID card" value={user.id_card_no} />
          <ProfileRow label="Department" value={user.department} />
          <ProfileRow label="Designation" value={user.designation} />
          <ProfileRow label="Phone" value={user.phone_no} />
        </View>
      ) : null}

      <TouchableOpacity
        onPress={async () => {
          setIsLoggingOut(true);
          try { await logout(); } finally { setIsLoggingOut(false); }
        }}
        disabled={isLoggingOut}
        style={[styles.logoutButton, isLoggingOut && styles.disabledButton]}
      >
        {isLoggingOut ? <ActivityIndicator color="#b42318" /> : <ThemedText style={styles.logoutText}>Sign out</ThemedText>}
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: "83%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5ece9",
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardEyebrow: {
    color: "#0f766e",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  name: {
    color: "#172522",
    fontSize: 23,
    fontWeight: "700",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#eef2f0",
  },
  label: {
    color: "#66736f",
    fontSize: 13,
    fontWeight: "500",
    width: 95,
  },
  value: {
    flex: 1,
    color: "#263632",
    fontSize: 14,
    textAlign: "right",
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#0f766e",
    borderRadius: 12,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 4,
    width: "100%",
    backgroundColor: "#fff",
    borderColor: "#f0c8c4",
    borderWidth: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#b42318",
    fontWeight: "600",
  },
  disabledButton: { opacity: 0.65 },
  stateCard: {
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5ece9",
    backgroundColor: "#fff",
    padding: 24,
  },
  stateTitle: { color: "#172522", fontSize: 16, fontWeight: "700", textAlign: "center" },
  stateText: { color: "#66736f", fontSize: 14, textAlign: "center" },
});
