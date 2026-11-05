import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LocationMap from "@/components/location-map";
import { PunchStatusBadge } from "@/components/attendenceCard";
import { usePunchAddress } from "@/hooks/use-punch-address";
import { coordinateLabel, punchDateTime, type AttendanceRecord } from "@/utils/attendanceHistory";

function MapContent({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const address = usePunchAddress(record);
  return (
    <View style={[styles.sheet, { maxHeight: height - insets.top - 16, paddingBottom: Math.max(insets.bottom, 16) }]} accessibilityViewIsModal>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>Punch location</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close punch map" onPress={onClose} style={styles.closeIcon}>
          <Ionicons name="close" size={24} color="#34453e" />
        </Pressable>
      </View>
      <Text style={styles.date}>{punchDateTime(record.submitted_at)}</Text>
      <PunchStatusBadge value={record.status} />
      <View style={[styles.map, { height: Math.min(340, height * 0.38) }]}>
        <LocationMap latitude={record.latitude} longitude={record.longitude} offices={[]} locationLabel="Punch location" />
      </View>
      <Text style={styles.address}>{address}</Text>
      <Text selectable style={styles.coordinates}>GPS: {coordinateLabel(record)}</Text>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </View>
  );
}

export default function PunchMapModal({ record, onClose }: { record: AttendanceRecord | null; onClose: () => void }) {
  return (
    <Modal visible={record !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss punch map" />
        {record ? <MapContent record={record} onClose={onClose} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.48)", justifyContent: "center", padding: 16 },
  sheet: { width: "100%", maxWidth: 520, alignSelf: "center", backgroundColor: "white", borderRadius: 22, padding: 18, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 21, fontWeight: "700", color: "#172522" },
  closeIcon: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  date: { fontSize: 14, color: "#52615c" },
  map: { overflow: "hidden", borderRadius: 12, backgroundColor: "#eef4f1", marginTop: 4 },
  address: { fontSize: 14, color: "#34453e", lineHeight: 20 },
  coordinates: { fontSize: 13, color: "#66736f", fontVariant: ["tabular-nums"] },
  closeButton: { minHeight: 46, borderWidth: 1, borderColor: "#0f766e", borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 4 },
  closeText: { fontSize: 15, fontWeight: "600", color: "#0f766e" },
});
