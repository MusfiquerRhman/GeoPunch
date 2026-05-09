import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { API_URL, BASE_URL } from '@/constants/API_URL';
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from 'react';
import { FlatList, View } from "react-native";
import AttendanceCard from '@/components/attendenceCard';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '../context/AuthContext';

interface AttendanceRecord {
    id: string;
    selfie_url: string;
    latitude: number;
    longitude: number;
    submitted_at: string;
    status: number;
}

export default function TabTwoScreen() {
    const { logout } = useAuth();

  const fetchAttendance = async () => {
    const token = await SecureStore.getItemAsync("token");

    const res = await fetch(`${API_URL}/geo_punch/record`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();

    if (!response.ok) {
      throw new Error(json.message || "Failed to fetch");
    }
    if (res.status === 401) {
      await logout();
      throw new Error("Unauthorized");
    }

    return json.data;
  };

  const {
    data: attendance = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["attendance"],
    queryFn: fetchAttendance,
  });

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <Image
          source={require("@/assets/images/Banner.jpeg")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{ fontFamily: Fonts.rounded }}
        >
          Attendance History
        </ThemedText>
      </ThemedView>

      {/* Loading state */}
      {isLoading && (
        <ThemedText>Loading attendance...</ThemedText>
      )}

      {/* Error state */}
      {error && (
        <ThemedText>
          Failed to load attendance
        </ThemedText>
      )}

      {/* Data */}
      {attendance.map((item: AttendanceRecord) => (
        <AttendanceCard
          key={item.id}
          item={item}
          baseUrl={BASE_URL}
        />
      ))}

      <ThemedText style={{ marginTop: 20, textAlign: "center" }}>
        Only the last 20 records are shown.
      </ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },  
  reactLogo: {
    height: '83%',
    width: '100%',
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
