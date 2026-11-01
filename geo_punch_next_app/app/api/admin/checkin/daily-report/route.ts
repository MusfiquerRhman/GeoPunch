import { db } from "@/utils/prisma";
import { dailyAttendanceReportFilters } from "@/utils/attendanceReportFilters";
import { createDailyAttendanceReport } from "@/utils/dailyAttendanceReport";
import { withAdminAuth } from "../../../_utils/auth";

export const runtime = "nodejs";

async function exportDailyAttendance(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  let where;
  try {
    where = dailyAttendanceReportFilters(params);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid date range" }, { status: 400 });
  }

  try {
    const records = await db.attendance_record.findMany({
      where,
      select: {
        id: true,
        employee_id: true,
        submitted_at: true,
        status: true,
        employees: { select: { id_card_no: true } },
      },
    });
    const buffer = await createDailyAttendanceReport(records);
    const filename = `geopunch-daily-attendance_${params.get("from")!.trim()}_to_${params.get("to")!.trim()}_Dhaka.xlsx`;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Daily attendance report export failed", error);
    return Response.json({ error: "Could not generate the daily attendance report. Please try again." }, { status: 500 });
  }
}

export const GET = withAdminAuth(exportDailyAttendance);
