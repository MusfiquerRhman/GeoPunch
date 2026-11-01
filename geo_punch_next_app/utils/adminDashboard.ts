import { attendanceReportFilters } from "./attendanceReportFilters";

const DAY = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET = 6 * 60 * 60 * 1000;

export function dhakaDate(value = new Date()) {
  return new Date(value.getTime() + DHAKA_OFFSET).toISOString().slice(0, 10);
}

export function dashboardFilters(params: URLSearchParams, now = new Date()) {
  const date = params.get("date") ?? dhakaDate(now);
  if (!date) throw new Error("Select a valid date.");
  const company = params.get("company")?.trim() || "";
  const office = params.get("office")?.trim() || "";
  const dayParams = new URLSearchParams({ from: date, to: date, company, office });
  const dayWhere = attendanceReportFilters(dayParams);
  const weekStart = new Date(new Date(`${date}T00:00:00Z`).getTime() - 6 * DAY).toISOString().slice(0, 10);
  const weekWhere = attendanceReportFilters(new URLSearchParams({ from: weekStart, to: date, company, office }));
  return { date, company, office, dayWhere, weekWhere };
}

export type DashboardEmployee = {
  id: string;
  company_id: string | null;
  company: { name: string } | null;
};

export type DashboardPoint = {
  employee_id: string | null;
  submitted_at: Date | null;
  status: number | null;
};

export type DashboardPendingPunch = {
  id: string;
  name: string;
  idCard: string | null;
  time: string | null;
  office: string | null;
  photo: string;
};

export type DashboardSummary = {
  activeEmployees: number;
  punchedEmployees: number;
  noPunchEmployees: number;
  pendingPunches: number;
  rejectedPunches: number;
  approvedPunches: number;
  trend: { date: string; count: number }[];
  companies: { id: string | null; name: string; active: number; punched: number }[];
};

export type DashboardData = DashboardSummary & {
  date: string;
  company: string;
  office: string;
  pending: DashboardPendingPunch[];
  updatedAt: string;
};

export type DashboardEmployeeView = "active" | "punched" | "no-punch";
export type DashboardEmployeeList = {
  employees: { id: string; name: string; id_card_no: string | null; company: { name: string } | null }[];
  total: number;
  page: number;
  pageSize: number;
};

/** Count people once per Dhaka day, while review totals count individual punches. */
export function summarizeDashboard(date: string, employees: DashboardEmployee[], records: DashboardPoint[]): DashboardSummary {
  const activeIds = new Set(employees.map((employee) => employee.id));
  const firstDay = new Date(`${date}T00:00:00Z`).getTime() - 6 * DAY;
  const days = new Map(Array.from({ length: 7 }, (_, index) => [
    new Date(firstDay + index * DAY).toISOString().slice(0, 10), new Set<string>(),
  ] as const));
  let pendingPunches = 0;
  let rejectedPunches = 0;
  let approvedPunches = 0;

  for (const record of records) {
    if (!record.employee_id || !record.submitted_at) continue;
    const day = dhakaDate(record.submitted_at);
    if (activeIds.has(record.employee_id)) days.get(day)?.add(record.employee_id);
    if (day !== date) continue;
    if (record.status === 1) pendingPunches++;
    if (record.status === 0) rejectedPunches++;
    if (record.status === 2) approvedPunches++;
  }

  const punched = days.get(date)!;
  const companies = new Map<string | null, DashboardSummary["companies"][number]>();
  for (const employee of employees) {
    let company = companies.get(employee.company_id);
    if (!company) {
      company = { id: employee.company_id, name: employee.company?.name ?? "Unassigned", active: 0, punched: 0 };
      companies.set(employee.company_id, company);
    }
    company.active++;
    if (punched.has(employee.id)) company.punched++;
  }

  return {
    activeEmployees: activeIds.size,
    punchedEmployees: punched.size,
    noPunchEmployees: activeIds.size - punched.size,
    pendingPunches, rejectedPunches, approvedPunches,
    trend: [...days].map(([day, ids]) => ({ date: day, count: ids.size })),
    companies: [...companies.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function dashboardQuery(date: string, company = "", office = "") {
  const params = new URLSearchParams({ date });
  if (company) params.set("company", company);
  if (office) params.set("office", office);
  return params;
}
