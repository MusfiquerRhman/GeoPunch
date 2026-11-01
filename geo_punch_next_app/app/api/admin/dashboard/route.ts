import { db } from "@/utils/prisma";
import { summarizeDashboard } from "@/utils/adminDashboard";
import { withAdminAuth } from "../../_utils/auth";
import { protectedSelfieUrl } from "../../_utils/attendanceFiles";
import { dashboardError, dashboardScope } from "./scope";

async function getDashboard(request: Request): Promise<Response> {
  try {
    const scope = await dashboardScope(request);
    const [employees, points, pending] = await db.$transaction(async (tx) => Promise.all([
      tx.employees.findMany({
        where: scope.employeeWhere,
        select: { id: true, company_id: true, company: { select: { name: true } } },
      }),
      tx.attendance_record.findMany({
        where: scope.weekWhere,
        select: { employee_id: true, submitted_at: true, status: true },
      }),
      tx.attendance_record.findMany({
        where: { ...scope.dayWhere, status: 1, employee_id: { not: null } },
        orderBy: [{ submitted_at: "asc" }, { id: "asc" }],
        take: 4,
        select: {
          id: true, submitted_at: true, selfie_url: true,
          employees: { select: { name: true, id_card_no: true } },
          office_locations: { select: { offices: { select: { name: true } } } },
        },
      }),
    ]), { isolationLevel: "RepeatableRead" });

    return Response.json({
      ...summarizeDashboard(scope.date, employees, points),
      date: scope.date, company: scope.company, office: scope.office,
      pending: pending.map((record) => ({
        id: record.id, name: record.employees?.name ?? "Unknown employee", idCard: record.employees?.id_card_no ?? null,
        time: record.submitted_at?.toISOString() ?? null,
        office: record.office_locations?.offices?.name ?? null,
        photo: protectedSelfieUrl(record.selfie_url),
      })),
      updatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return dashboardError(error);
  }
}

export const GET = withAdminAuth(getDashboard);
