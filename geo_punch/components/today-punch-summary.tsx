import { useIsFocused } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { apiRequest } from "@/constants/apiRequest";
import { dateLabel, dayKey, groupPunches, monthKey, punchTime, type AttendanceRecord } from "@/utils/attendanceHistory";

type Props = { token: string | null; onUnauthorized: () => Promise<void> };
type HistoryResponse = { data: AttendanceRecord[]; nextCursor: string | null };
const EMPTY: AttendanceRecord[] = [];

export default function TodayPunchSummary({ token, onUnauthorized }: Props) {
  const focused = useIsFocused();
  const [now, setNow] = useState(() => new Date());
  const today = dayKey(now)!;
  const month = monthKey(now);
  const query = useQuery({
    // Share the full response with History so a successful submission updates both screens.
    queryKey: ["attendance", "month", month],
    enabled: Boolean(token) && focused,
    staleTime: 30_000,
    queryFn: async () => {
      const result = await apiRequest<HistoryResponse>(`/geo_punch/history?month=${month}`, { token, onUnauthorized });
      if (!Array.isArray(result.data)) throw new Error("Could not read today's punches.");
      return result;
    },
  });
  const { refetch } = query;

  useEffect(() => {
    if (!focused || !token) return;
    const refresh = () => { setNow(new Date()); void refetch(); };
    refresh();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") refresh(); });
    const timer = setInterval(() => { if (AppState.currentState === "active") refresh(); }, 60_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [focused, refetch, token]);

  const punches = useMemo(() => groupPunches(query.data?.data ?? EMPTY)[today] ?? EMPTY, [query.data, today]);
  const first = punches[0];
  const last = punches[punches.length - 1];

  return (
    <View style={styles.section} testID="today-punch-summary" accessibilityLiveRegion="polite">
      <Text accessibilityRole="header" style={styles.date}>{dateLabel(today, true)}</Text>
      {query.data ? (
        <Text style={styles.count}>{punches.length} {punches.length === 1 ? "punch" : "punches"} today</Text>
      ) : query.isPending ? (
        <View style={styles.loading}><ActivityIndicator size="small" color="#0f766e" /><Text style={styles.count}>Loading today&apos;s punches…</Text></View>
      ) : <Text style={styles.count}>Today&apos;s punches unavailable</Text>}
      <View style={styles.summary}>
        <View style={styles.column}>
          <Text style={styles.label}>First punch</Text>
          <Text style={styles.time}>{first ? punchTime(first.submitted_at) : "—"}</Text>
        </View>
        <View style={[styles.column, styles.lastColumn]}>
          <Text style={styles.label}>Last punch</Text>
          <Text style={styles.time}>{punches.length === 1 ? "-" : last ? punchTime(last.submitted_at) : "—"}</Text>
        </View>
      </View>
      {query.error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>Couldn&apos;t refresh today&apos;s punches.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry today's punch summary" onPress={() => void refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 7, marginBottom: 6 },
  date: { fontSize: 18, lineHeight: 25, fontWeight: "700", color: "#172522" },
  count: { fontSize: 13, lineHeight: 19, color: "#66736f" },
  loading: { flexDirection: "row", alignItems: "center", gap: 8 },
  summary: { flexDirection: "row", backgroundColor: "#e4f6f1", borderRadius: 14, paddingVertical: 16, marginTop: 2 },
  column: { flex: 1, paddingHorizontal: 18, gap: 6 },
  lastColumn: { borderLeftWidth: 1, borderColor: "#beddd3" },
  label: { fontSize: 13, lineHeight: 18, color: "#34453e" },
  time: { fontSize: 23, lineHeight: 30, fontWeight: "700", color: "#172522", fontVariant: ["tabular-nums"] },
  errorRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8 },
  errorText: { fontSize: 12, lineHeight: 18, color: "#b42335" },
  retry: { minHeight: 44, paddingHorizontal: 8, justifyContent: "center" },
  retryText: { fontSize: 13, fontWeight: "600", color: "#0f766e" },
});
