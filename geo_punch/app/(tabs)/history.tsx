import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import AttendanceCard from "@/components/attendenceCard";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Fonts } from "@/constants/theme";
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
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={<Image source={require("@/assets/images/Banner.jpeg")} style={styles.reactLogo} />}
    >
      <View style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Attendance history
        </ThemedText>
      </View>

      {isLoading ? <ThemedText>Loading attendance...</ThemedText> : null}
      {error ? (
        <View>
          <ThemedText>Could not load attendance: {error.message}</ThemedText>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
      {!isLoading && !error && attendance.length === 0 ? <ThemedText>No attendance records yet.</ThemedText> : null}

      {attendance.map((item) => (
        <AttendanceCard key={item.id} item={item} baseUrl={BASE_URL} token={token} />
      ))}

      {attendance.length > 0 ? (
        <ThemedText style={{ marginTop: 20, textAlign: "center" }}>
          Showing the latest 20 records.
        </ThemedText>
      ) : null}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    gap: 8,
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
    backgroundColor: "#007AFF",
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
});
