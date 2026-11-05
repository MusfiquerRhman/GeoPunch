import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import AttendanceCard from "@/components/attendenceCard";
import { calendarDays, dateLabel, groupPunches, monthLabel, punchStatus, punchTime, type AttendanceRecord } from "@/utils/attendanceHistory";

type Props = {
  month: string;
  today: string;
  selectedDay: string;
  records: AttendanceRecord[];
  loading: boolean;
  unavailable: boolean;
  baseUrl: string;
  token: string | null;
  onChangeMonth: (direction: number) => void;
  onToday: () => void;
  onSelectDay: (day: string) => void;
  onViewMap: (record: AttendanceRecord) => void;
};

export default function MonthlyCalendar(props: Props) {
  const { month, today, selectedDay, records, loading, unavailable, baseUrl, token, onChangeMonth, onToday, onSelectDay, onViewMap } = props;
  const groups = useMemo(() => groupPunches(records), [records]);
  const days = useMemo(() => calendarDays(month), [month]);
  const selected = groups[selectedDay] ?? [];

  return (
    <View style={styles.section}>
      <View style={styles.navigation}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={month === "1970-01"} onPress={() => onChangeMonth(-1)} style={styles.arrow}>
          <Ionicons name="chevron-back" color="#34453e" size={20} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.month}>{monthLabel(month)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={month === "9998-12"} onPress={() => onChangeMonth(1)} style={styles.arrow}>
          <Ionicons name="chevron-forward" color="#34453e" size={20} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onToday} style={styles.todayButton}>
          <Text style={styles.todayText}>Today</Text>
        </Pressable>
      </View>
      {loading ? <View style={styles.loading}><ActivityIndicator color="#0f766e" /><Text style={styles.note}>Loading month…</Text></View> : null}
      <View style={styles.week}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <Text key={day} style={styles.weekday}>{day}</Text>)}
      </View>
      <View style={styles.grid} testID="attendance-calendar">
        {Array.from({ length: days.length / 7 }, (_, week) => (
          <View key={week} style={styles.week}>
            {days.slice(week * 7, week * 7 + 7).map(day => {
              const punches = day.inMonth ? groups[day.key] ?? [] : [];
              const selected = day.key === selectedDay;
              const counts = [2, 1, 0].map(status => `${punches.filter(punch => punch.status === status).length} ${punchStatus(status).label.toLowerCase()}`).join(", ");
              return (
                <Pressable
                  key={day.key}
                  testID={`calendar-day-${day.key}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${dateLabel(day.key)}, ${loading || unavailable ? "punches unavailable" : `${punches.length} punches, ${counts}`}${day.key === today ? ", today" : ""}`}
                  accessibilityState={{ selected, disabled: !day.inMonth }}
                  disabled={!day.inMonth}
                  onPress={() => onSelectDay(day.key)}
                  style={[styles.cell, selected && styles.selectedCell]}
                >
                  <Text style={[styles.day, !day.inMonth && styles.outsideDay, selected && styles.selectedDay, day.key === today && styles.currentDay]}>{day.day}</Text>
                  <View style={styles.dots}>
                    {punches.map(punch => <View key={punch.id} testID={`calendar-dot-${punch.id}`} style={[styles.dot, { backgroundColor: punchStatus(punch.status).dot }]} />)}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        {[2, 1, 0].map(value => {
          const status = punchStatus(value);
          return <View key={value} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: status.dot }]} /><Text style={styles.legendText}>{status.label}</Text></View>;
        })}
      </View>
      <Text style={styles.note}>One dot per punch · Blank = no punch</Text>
      <View style={styles.selectedSection} testID="selected-day-punches">
        <Text accessibilityRole="header" style={styles.sectionTitle}>{dateLabel(selectedDay, true)}</Text>
        {loading || unavailable ? (
          <Text style={styles.note}>{loading ? "Loading this day's punches…" : "This day's punches could not be loaded. Try refreshing."}</Text>
        ) : (
          <>
            <Text style={styles.note}>{selected.length} {selected.length === 1 ? "punch" : "punches"} · Dhaka time</Text>
            {selected.length ? (
              <View style={styles.summary}>
                <View style={styles.summaryColumn}><Text style={styles.summaryLabel}>First punch</Text><Text style={styles.summaryTime}>{punchTime(selected[0].submitted_at)}</Text></View>
                <View style={[styles.summaryColumn, styles.lastColumn]}><Text style={styles.summaryLabel}>Last punch</Text><Text style={styles.summaryTime}>{selected.length > 1 ? punchTime(selected[selected.length - 1].submitted_at) : "-"}</Text></View>
              </View>
            ) : <View style={styles.empty}><Ionicons name="calendar-outline" size={24} color="#83938c" /><Text style={styles.note}>No punches recorded on this day.</Text></View>}
            {selected.map(record => <AttendanceCard key={record.id} item={record} baseUrl={baseUrl} token={token} onViewMap={onViewMap} />)}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, marginTop: 12 },
  navigation: { flexDirection: "row", alignItems: "center", gap: 4 },
  arrow: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#e2eae7" },
  month: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "700", color: "#172522" },
  todayButton: { height: 44, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#0f766e", marginLeft: 4 },
  todayText: { fontSize: 12, color: "#0f766e", fontWeight: "600" },
  week: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", color: "#66736f", fontSize: 11, paddingVertical: 4 },
  grid: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#e2eae7", borderRadius: 10, overflow: "hidden" },
  cell: { flex: 1, minWidth: 0, minHeight: 62, alignItems: "center", gap: 7, paddingHorizontal: 4, paddingVertical: 9, borderBottomWidth: 1, borderRightWidth: 1, borderColor: "#e2eae7" },
  selectedCell: { backgroundColor: "#def5ef", borderColor: "#0f766e", borderWidth: 1, borderRadius: 7 },
  day: { fontSize: 13, color: "#24372e", fontVariant: ["tabular-nums"] },
  outsideDay: { color: "#acb8b2" },
  selectedDay: { color: "#0f766e", fontWeight: "700" },
  currentDay: { textDecorationLine: "underline", fontWeight: "700" },
  dots: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 3, width: "100%" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { fontSize: 12, color: "#52615c" },
  note: { fontSize: 12, color: "#66736f", lineHeight: 18 },
  loading: { flexDirection: "row", gap: 9, alignItems: "center" },
  selectedSection: { borderTopWidth: 1, borderColor: "#e2eae7", paddingTop: 20, marginTop: 6, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#172522" },
  summary: { backgroundColor: "#e4f6f1", borderRadius: 14, paddingVertical: 18, flexDirection: "row" },
  summaryColumn: { flex: 1, paddingHorizontal: 16, gap: 7 },
  lastColumn: { borderLeftWidth: 1, borderColor: "#beddd3" },
  summaryLabel: { fontSize: 12, color: "#34453e" },
  summaryTime: { fontSize: 22, fontWeight: "700", color: "#172522", fontVariant: ["tabular-nums"] },
  empty: { paddingVertical: 20, alignItems: "center", gap: 10, backgroundColor: "#f5f8f6", borderRadius: 12 },
});
