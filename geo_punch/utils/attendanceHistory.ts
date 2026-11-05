export type AttendanceRecord = {
  id: string;
  selfie_url: string;
  latitude: number;
  longitude: number;
  submitted_at: string | null;
  status: number | null;
  address?: string | null;
  notes?: string | null;
};

export const ATTENDANCE_TIME_ZONE = "Asia/Dhaka";
const DAY = 86_400_000;
const DHAKA_OFFSET = 6 * 60 * 60 * 1000;

export function dayKey(value: string | Date | null): string | null {
  if (value === null) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Date(date.getTime() + DHAKA_OFFSET).toISOString().slice(0, 10)
    : null;
}

export function monthKey(now = new Date()) {
  return dayKey(now)!.slice(0, 7);
}

export function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}

export function monthLabel(month: string) {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: ATTENDANCE_TIME_ZONE, month: "long", year: "numeric",
  });
}

export function dateLabel(day: string, weekday = false) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: ATTENDANCE_TIME_ZONE, day: "numeric", month: "long", year: "numeric",
    ...(weekday ? { weekday: "short" as const } : {}),
  });
}

export function punchTime(value: string | null, seconds = false) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleTimeString("en-US", {
        timeZone: ATTENDANCE_TIME_ZONE, hour: "numeric", minute: "2-digit",
        ...(seconds ? { second: "2-digit" as const } : {}), hour12: true,
      })
    : "Time unavailable";
}

export function punchDateTime(value: string | null) {
  const day = dayKey(value);
  return day ? `${dateLabel(day)} · ${punchTime(value, true)}` : "Time unavailable";
}

export function punchStatus(value: number | null) {
  if (value === 2) return { label: "Approved", color: "#087e52", background: "#def7ec", dot: "#059669" };
  if (value === 1) return { label: "Pending", color: "#985900", background: "#fff4d9", dot: "#f59e0b" };
  if (value === 0) return { label: "Rejected", color: "#b42335", background: "#ffe7eb", dot: "#e11d48" };
  return { label: "Unknown status", color: "#52615c", background: "#eef2f1", dot: "#64748b" };
}

export function validCoordinates(record: Pick<AttendanceRecord, "latitude" | "longitude">) {
  return Number.isFinite(record.latitude) && Math.abs(record.latitude) <= 90
    && Number.isFinite(record.longitude) && Math.abs(record.longitude) <= 180;
}

export function coordinateLabel(record: Pick<AttendanceRecord, "latitude" | "longitude">) {
  return validCoordinates(record)
    ? `${record.latitude.toFixed(5)}, ${record.longitude.toFixed(5)}`
    : "Coordinates unavailable";
}

export function groupPunches(records: AttendanceRecord[]) {
  const groups: Record<string, AttendanceRecord[]> = {};
  for (const record of records) {
    const key = dayKey(record.submitted_at) ?? "unknown";
    (groups[key] ??= []).push(record);
  }
  for (const punches of Object.values(groups)) {
    punches.sort((a, b) => (Date.parse(a.submitted_at ?? "") || 0) - (Date.parse(b.submitted_at ?? "") || 0)
      || a.id.localeCompare(b.id));
  }
  return groups;
}

export function monthlyCounts(records: AttendanceRecord[], month: string) {
  const selected = records.filter(record => dayKey(record.submitted_at)?.startsWith(`${month}-`));
  return {
    recorded: selected.length,
    pending: selected.filter(record => record.status === 1).length,
    rejected: selected.filter(record => record.status === 0).length,
  };
}

export function calendarDays(month: string) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const next = new Date(first);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const days = Math.round((next.getTime() - first.getTime()) / DAY);
  const length = Math.ceil((first.getUTCDay() + days) / 7) * 7;
  return Array.from({ length }, (_, index) => {
    const date = new Date(first.getTime() + (index - first.getUTCDay()) * DAY);
    const key = date.toISOString().slice(0, 10);
    return { key, day: date.getUTCDate(), inMonth: key.startsWith(`${month}-`) };
  });
}
