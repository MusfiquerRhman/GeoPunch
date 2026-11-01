import { db } from "@/utils/prisma";
import { createDailyAttendanceReport } from "@/utils/dailyAttendanceReport";
import { withAdminAuth } from "../../../_utils/auth";
import { dashboardError, dashboardScope } from "../scope";

async function exportDashboard(request: Request): Promise<Response> {
  try {
    const scope = await dashboardScope(request);
    const records = await db.attendance_record.findMany({
      where: { ...scope.dayWhere, employee_id: { not: null } },
      select: { id: true, employee_id: true, submitted_at: true, status: true, employees: { select: { id_card_no: true } } },
    });
    const buffer = await createDailyAttendanceReport(records);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="geopunch-dashboard_${scope.date}_Dhaka.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return dashboardError(error);
  }
}

export const GET = withAdminAuth(exportDashboard);
