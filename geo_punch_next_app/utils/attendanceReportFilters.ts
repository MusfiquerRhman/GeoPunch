import type { Prisma } from "@/app/generated/prisma/client";

// Date inputs represent calendar days in Dhaka; the upper boundary is exclusive.
function dateBoundary(value: string, nextDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Use a valid date.");
  const day = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== value) {
    throw new Error("Use a valid date.");
  }
  return new Date(day.getTime() - 6 * 60 * 60 * 1000 + (nextDay ? 86400000 : 0));
}

export function attendanceReportFilters(params: URLSearchParams): Prisma.attendance_recordWhereInput {
  const from = params.get("from")?.trim();
  const to = params.get("to")?.trim();
  const office = params.get("office")?.trim();
  const company = params.get("company")?.trim();
  const status = params.get("status")?.trim();
  const where: Prisma.attendance_recordWhereInput = {};
  if (from || to) {
    const gte = from ? dateBoundary(from) : undefined;
    const lt = to ? dateBoundary(to, true) : undefined;
    if (gte && lt && gte >= lt) throw new Error("From date must be on or before To date.");
    where.submitted_at = { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) };
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (office) {
    if (!uuid.test(office)) throw new Error("Select a valid office.");
    where.office_locations = { is: { office_id: office } };
  }
  if (company) {
    if (!uuid.test(company)) throw new Error("Select a valid company.");
    where.employees = { is: { company_id: company } };
  }
  if (status) {
    if (!["0", "1", "2"].includes(status)) throw new Error("Select a valid status.");
    where.status = Number(status);
  }
  return where;
}
