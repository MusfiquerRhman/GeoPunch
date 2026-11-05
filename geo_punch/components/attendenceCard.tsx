import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { usePunchAddress } from "@/hooks/use-punch-address";
import { coordinateLabel, punchDateTime, punchStatus, validCoordinates, type AttendanceRecord } from "@/utils/attendanceHistory";

export function PunchStatusBadge({ value }: { value: number | null }) {
  const status = punchStatus(value);
  return (
    <View style={[styles.badge, { backgroundColor: status.background }]}>
      <View style={[styles.dot, { backgroundColor: status.dot }]} />
      <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
    </View>
  );
}

type Props = {
  item: AttendanceRecord;
  baseUrl: string;
  token: string | null;
  onViewMap: (record: AttendanceRecord) => void;
};

export default function AttendanceCard({ item, baseUrl, token, onViewMap }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const address = usePunchAddress(item);
  useEffect(() => setImageFailed(false), [item.selfie_url, token]);

  return (
    <View style={styles.card} testID={`punch-${item.id}`}>
      {imageFailed || !item.selfie_url ? (
        <View style={styles.image} accessibilityLabel="Selfie unavailable">
          <Ionicons name="person-outline" size={26} color="#82918c" />
        </View>
      ) : (
        <Image
          source={{ uri: `${baseUrl}${item.selfie_url}`, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
          style={styles.image}
          accessibilityLabel={`Attendance selfie, ${punchDateTime(item.submitted_at)}`}
          onError={() => setImageFailed(true)}
        />
      )}
      <View style={styles.info}>
        <View style={styles.heading}>
          <Text style={styles.timestamp}>{punchDateTime(item.submitted_at)}</Text>
          <PunchStatusBadge value={item.status} />
        </View>
        <View style={styles.detail}>
          <Ionicons name="location-outline" size={16} color="#0f766e" />
          <Text style={styles.detailText}>{address}</Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="locate-outline" size={16} color="#6b7b75" />
          <Text selectable style={styles.coordinates}>{coordinateLabel(item)}</Text>
        </View>
        {item.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Punch notes</Text>
            <Text selectable style={styles.notesText}>{item.notes}</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View punch on map, ${punchDateTime(item.submitted_at)}`}
          accessibilityState={{ disabled: !validCoordinates(item) }}
          disabled={!validCoordinates(item)}
          hitSlop={7}
          onPress={() => onViewMap(item)}
          style={({ pressed }) => [styles.mapButton, pressed && styles.pressed, !validCoordinates(item) && styles.disabled]}
        >
          <Ionicons name="map-outline" size={14} color="#0f766e" />
          <Text style={styles.mapText}>View on map</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#e2eae7", backgroundColor: "#fff", gap: 12, boxShadow: "0px 1px 2px rgba(23, 37, 34, 0.06)" },
  image: { width: 76, height: 90, borderRadius: 12, backgroundColor: "#eff4f2", alignItems: "center", justifyContent: "center" },
  info: { flex: 1, minWidth: 0, gap: 9 },
  heading: { flexDirection: "row", alignItems: "flex-start", flexWrap: "wrap", gap: 8 },
  timestamp: { flexGrow: 1, flexShrink: 1, flexBasis: 130, fontSize: 14, lineHeight: 20, fontWeight: "700", color: "#172522" },
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  status: { fontSize: 12, fontWeight: "600" },
  detail: { flexDirection: "row", gap: 7, alignItems: "flex-start" },
  detailText: { color: "#52615c", fontSize: 13, lineHeight: 19, flex: 1 },
  coordinates: { color: "#52615c", fontSize: 13, lineHeight: 19, flex: 1, fontVariant: ["tabular-nums"] },
  notes: { gap: 3 },
  notesLabel: { color: "#34453e", fontSize: 12, fontWeight: "600" },
  notesText: { color: "#52615c", fontSize: 13, lineHeight: 19 },
  mapButton: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "center", alignSelf: "flex-end", gap: 5, paddingHorizontal: 9, borderWidth: 1, borderColor: "#a0d5cc", borderRadius: 7 },
  mapText: { color: "#0f766e", fontSize: 12, fontWeight: "600" },
  pressed: { backgroundColor: "#ecf8f4" },
  disabled: { opacity: 0.45 },
});
