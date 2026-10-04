import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
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
  if (status === 1) return { label: "Pending", color: "#a15c00" };
  if (status === 2) return { label: "Approved", color: "#18794e" };
  return { label: "Rejected", color: "#b42318" };
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
        <Text style={[styles.title, { color: status.color }]}>{status.label}</Text>
        <Text style={styles.text}>📍 {address}</Text>
        <Text style={styles.text}>
          🕒 {Number.isNaN(submittedAt.getTime()) ? "Time unavailable" : submittedAt.toLocaleString()}
        </Text>
        <Text style={styles.id}>ID: {item.id}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: "#444",
    marginTop: 2,
  },
  id: {
    marginTop: 6,
    fontSize: 11,
    color: "#888",
  },
});
