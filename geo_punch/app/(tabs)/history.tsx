import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import AttendanceCard from "@/components/attendenceCard";
import MonthlyCalendar from "@/components/history/monthly-calendar";
import PunchMapModal from "@/components/history/punch-map-modal";
import TabHeaderImage, { TabHeader } from "@/components/tab-header-image";
import { BASE_URL } from "@/constants/API_URL";
import { apiRequest } from "@/constants/apiRequest";
import { useAuth } from "@/context/AuthContext";
import { dateLabel, dayKey, monthKey, monthLabel, monthlyCounts, shiftMonth, type AttendanceRecord } from "@/utils/attendanceHistory";

type HistoryResponse = { data: AttendanceRecord[]; nextCursor: string | null };
const EMPTY: AttendanceRecord[] = [];
const LIST_PAGE_SIZE = 10;

function Notice({ title, message, loading, onRetry }: { title: string; message?: string; loading?: boolean; onRetry?: () => void }) {
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      {loading ? <ActivityIndicator color="#0f766e" /> : null}
      <Text style={styles.noticeTitle}>{title}</Text>
      {message ? <Text style={styles.note}>{message}</Text> : null}
      {onRetry ? <Pressable accessibilityRole="button" onPress={onRetry} style={styles.outlineButton}><Text style={styles.buttonText}>Try again</Text></Pressable> : null}
    </View>
  );
}

export default function HistoryScreen() {
  const { token, logout } = useAuth();
  return <EmployeeHistory token={token} onUnauthorized={logout} />;
}

export function EmployeeHistory({ token, onUnauthorized }: { token: string | null; onUnauthorized: () => Promise<void> }) {
  const focused = useIsFocused();
  const [now, setNow] = useState(() => new Date());
  const today = dayKey(now)!;
  const currentMonth = monthKey(now);
  const previousToday = useRef(today);
  const [month, setMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState(today);
  const [view, setView] = useState<"calendar" | "list">("list");
  const [page, setPage] = useState(0);
  const [mapRecord, setMapRecord] = useState<AttendanceRecord | null>(null);
  const request = useCallback(async (path: string) => {
    const response = await apiRequest<HistoryResponse>(path, { token, onUnauthorized });
    if (!Array.isArray(response.data)) throw new Error("Could not read attendance records. Please try again.");
    return response;
  }, [onUnauthorized, token]);

  const monthQuery = useQuery({
    queryKey: ["attendance", "month", month], enabled: Boolean(token) && focused && view === "calendar",
    queryFn: () => request(`/geo_punch/history?month=${month}`), staleTime: 30_000,
  });
  const listQuery = useInfiniteQuery({
    queryKey: ["attendance", "list"], enabled: Boolean(token) && focused && view === "list",
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => request(`/geo_punch/history${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""}`),
    getNextPageParam: page => page.nextCursor ?? undefined, staleTime: 30_000,
  });
  const { refetch: refreshMonth } = monthQuery;
  const { refetch: refreshList } = listQuery;
  const refresh = useCallback(() => {
    setNow(new Date());
    if (!token) return;
    if (view === "list") void refreshList();
    else void refreshMonth();
  }, [refreshList, refreshMonth, token, view]);

  useEffect(() => {
    if (!focused) return;
    refresh();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") refresh(); });
    const timer = setInterval(() => { if (AppState.currentState === "active") refresh(); }, 60_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [focused, refresh]);

  useEffect(() => {
    const previous = previousToday.current;
    if (previous === today) return;
    setMonth(value => value === previous.slice(0, 7) ? currentMonth : value);
    setSelectedDay(value => value === previous ? today : value);
    previousToday.current = today;
  }, [currentMonth, today]);

  const monthRecords = monthQuery.data?.data ?? EMPTY;
  const counts = useMemo(() => monthlyCounts(monthRecords, month), [month, monthRecords]);
  const listRecords = useMemo(() => {
    const unique = new Map<string, AttendanceRecord>();
    for (const page of listQuery.data?.pages ?? []) for (const record of page.data) unique.set(record.id, record);
    return [...unique.values()];
  }, [listQuery.data]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(listRecords.length / LIST_PAGE_SIZE) - 1));
  const pageRecords = listRecords.slice(currentPage * LIST_PAGE_SIZE, (currentPage + 1) * LIST_PAGE_SIZE);
  const hasCachedNextPage = (currentPage + 1) * LIST_PAGE_SIZE < listRecords.length;
  const hasNextPage = hasCachedNextPage || listQuery.hasNextPage;
  const nextPageFailed = listQuery.isFetchNextPageError && !hasCachedNextPage;
  const refreshing = view === "list" ? listQuery.isRefetching : monthQuery.isRefetching;
  const busy = view === "list" ? listQuery.isFetching : monthQuery.isFetching;

  async function nextPage() {
    if (listQuery.isFetching || !hasNextPage) return;
    if (hasCachedNextPage) {
      setPage(currentPage + 1);
      return;
    }
    const result = await listQuery.fetchNextPage();
    const loadedIds = new Set(result.data?.pages.flatMap(batch => batch.data.map(record => record.id)));
    if (!result.isFetchNextPageError && loadedIds.size > (currentPage + 1) * LIST_PAGE_SIZE) setPage(currentPage + 1);
  }

  function navigateMonth(direction: number) {
    const next = shiftMonth(month, direction);
    setMonth(next);
    setSelectedDay(next === currentMonth ? today : `${next}-01`);
  }

  const header = (
    <View style={styles.header}>
      <TabHeader headerImage={<TabHeaderImage />} />
      <View style={[styles.content, styles.headerContent]}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.title}>{view === "calendar" ? "Attendance history" : "Punch list"}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh attendance history" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={refresh} style={styles.refreshButton}>
            {busy ? <ActivityIndicator size="small" color="#0f766e" /> : <Ionicons name="refresh-outline" color="#0f766e" size={22} />}
          </Pressable>
        </View>
        <Text style={styles.subtitle}>{view === "calendar" ? "My attendance" : "Latest first"} · Dhaka time</Text>
        <View style={styles.tabs} accessibilityRole="tablist">
          {(["list", "calendar"] as const).map(mode => <Pressable key={mode} accessibilityRole="tab" accessibilityLabel={mode === "calendar" ? "Calendar" : "List"} accessibilityState={{ selected: view === mode }} onPress={() => setView(mode)} style={[styles.tab, view === mode && styles.selectedTab]}>
            <Ionicons name={mode === "calendar" ? "calendar-outline" : "list-outline"} size={18} color={view === mode ? "#0f766e" : "#66736f"} />
            <Text style={[styles.tabText, view === mode && styles.selectedTabText]}>{mode === "calendar" ? "Calendar" : "List"}</Text>
          </Pressable>)}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {view === "calendar" ? (
        <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0f766e" colors={["#0f766e"]} />}>
          {header}
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.eyebrow}>{month === currentMonth ? "This month" : "Month totals"} · {monthLabel(month)}</Text>
              <View style={styles.counters}>
                {([
                  { label: "Punches recorded", value: counts.recorded, color: "#0866c7" },
                  { label: "Pending punches", value: counts.pending, color: "#b66a00" },
                  { label: "Rejected punches", value: counts.rejected, color: "#cf2441" },
                ]).map(counter => <View key={counter.label} style={styles.counter}>
                  <Text style={[styles.counterValue, { color: counter.color }]}>{monthQuery.data ? counter.value : "—"}</Text>
                  <Text style={styles.counterLabel}>{counter.label}</Text>
                </View>)}
              </View>
            </View>
            <View>
              {monthQuery.error ? <Notice title="Couldn't refresh this month" message={monthQuery.error.message} onRetry={() => void refreshMonth()} /> : null}
              <MonthlyCalendar month={month} today={today} selectedDay={selectedDay} records={monthRecords} loading={monthQuery.isPending} unavailable={Boolean(monthQuery.error) && !monthQuery.data} baseUrl={BASE_URL} token={token} onChangeMonth={navigateMonth} onSelectDay={setSelectedDay} onViewMap={setMapRecord} onToday={() => { setMonth(currentMonth); setSelectedDay(today); }} />
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
          key={currentPage} data={pageRecords} keyExtractor={record => record.id} contentContainerStyle={styles.scrollContent}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          ListHeaderComponent={<View>{header}{listQuery.error && !listQuery.data ? <View style={styles.content}><Notice title="Couldn't load punch list" message={listQuery.error.message} onRetry={() => void refreshList()} /></View> : null}</View>}
          renderItem={({ item, index }) => {
            const date = dayKey(item.submitted_at);
            const previous = index ? dayKey(pageRecords[index - 1].submitted_at) : undefined;
            return <View style={styles.content}>
              {date !== previous ? <Text accessibilityRole="header" style={styles.listDate}>{date === today ? `Today · ${dateLabel(date)}` : date ? dateLabel(date, true) : "Date unavailable"}</Text> : null}
              <AttendanceCard item={item} baseUrl={BASE_URL} token={token} onViewMap={setMapRecord} />
            </View>;
          }}
          ListEmptyComponent={<View style={styles.content}>{listQuery.isPending ? <Notice title="Loading your punches…" loading /> : !listQuery.error ? <Notice title="No punches yet" message="All your recorded punches will appear here." /> : null}</View>}
          ListFooterComponent={<View style={[styles.content, styles.listFooter]}>
            {listQuery.error && listQuery.data && (!listQuery.isFetchNextPageError || nextPageFailed) ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{listQuery.error.message}</Text> : null}
            {listRecords.length ? <>
              <View style={styles.pagination}>
                <Pressable accessibilityRole="button" accessibilityLabel="Previous page" accessibilityState={{ disabled: currentPage === 0 || listQuery.isFetching }} disabled={currentPage === 0 || listQuery.isFetching} onPress={() => setPage(currentPage - 1)} style={[styles.outlineButton, styles.pageButton, (currentPage === 0 || listQuery.isFetching) && styles.disabledButton]}>
                  <Ionicons name="chevron-back" size={16} color="#0f766e" /><Text style={styles.buttonText}>Previous</Text>
                </Pressable>
                <Text accessibilityLiveRegion="polite" style={styles.pageLabel}>Page {currentPage + 1}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={nextPageFailed ? "Retry next page" : "Next page"} accessibilityState={{ disabled: !hasNextPage || listQuery.isFetching, busy: listQuery.isFetchingNextPage }} disabled={!hasNextPage || listQuery.isFetching} onPress={() => void nextPage()} style={[styles.outlineButton, styles.pageButton, (!hasNextPage || listQuery.isFetching) && styles.disabledButton]}>
                  {listQuery.isFetchingNextPage ? <ActivityIndicator size="small" color="#0f766e" /> : <><Text style={styles.buttonText}>{nextPageFailed ? "Retry" : "Next"}</Text><Ionicons name="chevron-forward" size={16} color="#0f766e" /></>}
                </Pressable>
              </View>
              <Text style={styles.pageNote}>10 punches per page · {hasNextPage ? "Latest first" : "Last page"}</Text>
            </> : null}
            {listQuery.error && listQuery.data && !listQuery.isFetchNextPageError ? <Pressable accessibilityRole="button" onPress={() => void refreshList()} style={styles.outlineButton}><Text style={styles.buttonText}>Refresh list</Text></Pressable> : null}
          </View>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0f766e" colors={["#0f766e"]} />}
          initialNumToRender={LIST_PAGE_SIZE} windowSize={7}
        />
      )}
      <PunchMapModal record={mapRecord} onClose={() => setMapRecord(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 32 },
  content: { paddingHorizontal: 18, maxWidth: 680, width: "100%", alignSelf: "center" },
  header: { marginBottom: 20 },
  headerContent: { gap: 9, paddingTop: 24 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  refreshButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "#eff8f4", borderRadius: 22 },
  title: { flex: 1, fontSize: 25, fontWeight: "700", letterSpacing: -0.5, color: "#172522" },
  subtitle: { fontSize: 14, color: "#66736f" },
  tabs: { flexDirection: "row", borderWidth: 1, borderColor: "#e2eae7", borderRadius: 11, backgroundColor: "#f7f9f8", padding: 3, marginTop: 7 },
  tab: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 8 },
  selectedTab: { backgroundColor: "#dff5ef" },
  tabText: { fontSize: 14, color: "#66736f", fontWeight: "600" },
  selectedTabText: { color: "#0f766e" },
  section: { gap: 12, marginBottom: 22 },
  eyebrow: { fontSize: 13, fontWeight: "600", color: "#34453e" },
  counters: { flexDirection: "row", gap: 7 },
  counter: { flex: 1, borderWidth: 1, borderColor: "#e2eae7", borderRadius: 12, padding: 10, gap: 5 },
  counterValue: { fontSize: 27, fontWeight: "700", fontVariant: ["tabular-nums"] },
  counterLabel: { fontSize: 11, color: "#52615c", lineHeight: 16 },
  note: { fontSize: 12, color: "#66736f", lineHeight: 18 },
  outlineButton: { minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: "#0f766e", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14, marginTop: 4 },
  buttonText: { fontSize: 14, color: "#0f766e", fontWeight: "600" },
  notice: { padding: 18, borderRadius: 14, borderWidth: 1, borderColor: "#e2eae7", backgroundColor: "#f8faf9", gap: 9 },
  noticeTitle: { fontSize: 14, fontWeight: "600", color: "#34453e" },
  listDate: { fontSize: 15, fontWeight: "700", color: "#172522", paddingTop: 24, paddingBottom: 12 },
  listSeparator: { height: 14 },
  listFooter: { paddingVertical: 20, gap: 12 },
  pagination: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageButton: { flex: 1, paddingHorizontal: 8, marginTop: 0, gap: 4 },
  disabledButton: { opacity: 0.4 },
  pageLabel: { fontSize: 13, fontWeight: "600", color: "#34453e", fontVariant: ["tabular-nums"] },
  pageNote: { fontSize: 12, color: "#66736f", lineHeight: 18, textAlign: "center" },
  errorText: { fontSize: 13, color: "#b42335", lineHeight: 19 },
});
