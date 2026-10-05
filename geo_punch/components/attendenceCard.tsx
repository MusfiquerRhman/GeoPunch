import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

type AttendanceRecord = {
  id: string | number;
  selfie_url: string;
  latitude: number;
  longitude: number;
  submitted_at: string;
  status: number;
};

type Props = {
  item: AttendanceRecord;
  baseUrl: string;
  token: string | null;
};

async function getAddress(latitude: number, longitude: number) {
  try {
    const result = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = result[0];
    if (!place) return "Unknown location";

    return [place.name, place.street, place.city, place.country]
      .filter(Boolean)
      .join(", ");
  } catch {
    return "Location unavailable";
  }
}

function statusLabel(status: number) {
  if (status === 1) return { label: "Pending", color: "#92400e", background: "#fef3c7" };
  if (status === 2) return { label: "Approved", color: "#166534", background: "#dcfce7" };
  return { label: "Rejected", color: "#b42318", background: "#fee2e2" };
}

export default function AttendanceCard({ item, baseUrl, token }: Props) {
  const [address, setAddress] = useState("Loading location...");
  const status = statusLabel(item.status);
  const submittedAt = new Date(item.submitted_at);

  useEffect(() => {
    let active = true;
    void getAddress(item.latitude, item.longitude).then((value) => {
      if (active) setAddress(value);
    });

    return () => {
      active = false;
    };
  }, [item.latitude, item.longitude]);

  return (
    <View style={styles.card}>
      <Image
        source={{
          uri: `${baseUrl}${item.selfie_url}`,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }}
        style={styles.image}
        accessibilityLabel="Attendance selfie"
      />

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Attendance</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#0f766e" />
          <Text style={styles.text} numberOfLines={2}>{address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#66736f" />
          <Text style={styles.text}>
            {Number.isNaN(submittedAt.getTime()) ? "Time unavailable" : submittedAt.toLocaleString()}
          </Text>
        </View>
        <Text style={styles.id}>ID: {item.id}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    marginVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5ece9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    alignItems: "center",
  },
  image: {
    width: 82,
    height: 92,
    borderRadius: 14,
    backgroundColor: "#f1f5f4",
  },
  info: {
    flex: 1,
    marginLeft: 14,
    gap: 7,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#172522",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    color: "#52615c",
    flex: 1,
  },
  id: {
    marginTop: 6,
    fontSize: 11,
    color: "#888",
  },
});
