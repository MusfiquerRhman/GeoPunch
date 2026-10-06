import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

import AttendanceCard from "@/components/attendenceCard";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Colors, Fonts } from "@/constants/theme";
import { apiRequest } from "@/constants/apiRequest";
import { BASE_URL } from "@/constants/API_URL";
import { useAuth } from "@/context/AuthContext";

interface AttendanceRecord {
  id: string | number;
  selfie_url: string;
  latitude: number;
  longitude: number;
  submitted_at: string;
  status: number;
}

export default function HistoryScreen() {
  const { token, logout } = useAuth();

  const {
    data: attendance = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["attendance"],
    enabled: Boolean(token),
    queryFn: async () => {
      const result = await apiRequest<{ data: AttendanceRecord[] }>("/geo_punch/record", {
        token,
        onUnauthorized: logout,
      });
      return result.data;
    },
  });

  return (
    <View style={styles.screen}>
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#dff3ef", dark: "#203b35" }}
      headerImage={<Image source={require("@/assets/images/Banner.jpeg")} style={styles.reactLogo} />}
    >
      <View style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Attendance history
        </ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.stateCard} accessibilityRole="progressbar">
          <ActivityIndicator color={Colors.light.tint} />
          <ThemedText style={styles.stateText}>Loading your attendance…</ThemedText>
        </View>
      ) : null}
      {error ? (
        <View style={styles.stateCard}>
          <ThemedText style={styles.stateTitle}>Couldn’t load attendance</ThemedText>
          <ThemedText style={styles.stateText}>{error.message}</ThemedText>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Try again</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
      {!isLoading && !error && attendance.length === 0 ? (
        <View style={styles.stateCard}>
          <ThemedText style={styles.stateTitle}>No attendance yet</ThemedText>
          <ThemedText style={styles.stateText}>Your submitted check-ins will appear here.</ThemedText>
        </View>
      ) : null}

      {attendance.map((item) => (
        <AttendanceCard key={item.id} item={item} baseUrl={BASE_URL} token={token} />
      ))}

      {attendance.length > 0 ? (
        <ThemedText style={{ marginTop: 20, textAlign: "center" }}>
          Showing the latest 20 records.
        </ThemedText>
      ) : null}
      <View style={styles.refreshSpace} />
    </ParallaxScrollView>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Refresh attendance history"
        accessibilityState={{ disabled: isFetching || !token, busy: isFetching }}
        disabled={isFetching || !token}
        onPress={() => void refetch()}
        style={styles.refreshButton}
      >
        {isFetching ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="refresh" size={25} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  refreshSpace: {
    height: 64,
  },
  refreshButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0f766e",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 2,
  },
  reactLogo: {
    height: "83%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
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
  stateCard: {
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5ece9",
    backgroundColor: "#fff",
    padding: 24,
  },
  stateTitle: {
    color: "#172522",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  stateText: {
    color: "#66736f",
    fontSize: 14,
    textAlign: "center",
  },
});
