import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { apiRequest } from "@/constants/apiRequest";
import { Fonts } from "@/constants/theme";
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
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={<Image source={require("@/assets/images/Banner.jpeg")} style={styles.reactLogo} />}
    >
      <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
        Your profile
      </ThemedText>

      {isLoading ? <ThemedText>Loading profile...</ThemedText> : null}
      {error ? (
        <View>
          <ThemedText>Could not load profile: {error.message}</ThemedText>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      {user ? (
        <View style={styles.card}>
          <ThemedText style={styles.name}>{user.name}</ThemedText>
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow label="ID card" value={user.id_card_no} />
          <ProfileRow label="Department" value={user.department} />
          <ProfileRow label="Designation" value={user.designation} />
          <ProfileRow label="Phone" value={user.phone_no} />
        </View>
      ) : null}

      <TouchableOpacity onPress={() => void logout()} style={styles.logoutButton}>
        <ThemedText style={styles.logoutText}>Log out</ThemedText>
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
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
    elevation: 3,
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    fontWeight: "500",
    width: 110,
  },
  value: {
    flex: 1,
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
  logoutButton: {
    marginTop: 10,
    width: "100%",
    backgroundColor: "#b42318",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
});
