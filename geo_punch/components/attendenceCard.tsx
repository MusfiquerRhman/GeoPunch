import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import * as Location from "expo-location";
import { API_URL } from '@/constants/API_URL';
import { ThemedText } from "./themed-text";

type Props = {
  item: {
    id: string;
    selfie_url: string;
    latitude: number;
    longitude: number;
    submitted_at: string;
    status: number;
  };
  baseUrl: string;
};

export async function getAddress(lat: number, lng: number) {
  try {
    const res = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (res.length > 0) {
      const place = res[0];
      return `${place.name ?? ""} ${place.street ?? ""}, ${place.city ?? ""}, ${place.country ?? ""}`;
    }

    return "Unknown location";
  } catch (err) {
    console.log("Reverse geocode error:", err);
    return "Location not found";
  }
}


export default function AttendanceCard({ item, baseUrl }: Props) {
  const [address, setAddress] = useState("Loading location...");

  console.log("image url:", `${baseUrl}${item.selfie_url}`);

  useEffect(() => {
    (async () => {
      const addr = await getAddress(item.latitude, item.longitude);
      setAddress(addr);
    })();
  }, [item.latitude, item.longitude]);

  return (
    <View style={styles.card}>
      
      {/* LEFT: IMAGE */}
      <Image
        source={{ uri: `${baseUrl}${item.selfie_url}` }}
        style={styles.image}
      />

      {/* RIGHT: INFO */}
      <View style={styles.info}>
        <Text style={{
            ...styles.title,
            color: item.status === 1 ? '#FFA500' : item.status === 2 ? '#4CAF50' : '#F44336',
        }}>{item.status === 1 ? 'Pending' : item.status === 2 ? 'Approved' : 'Rejected'}</Text>

        <Text style={styles.text}>
          📍 {address}
        </Text>

        <Text style={styles.text}>
          🕒 {new Date(item.submitted_at).toLocaleString()}
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
    marginVertical: 2,
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