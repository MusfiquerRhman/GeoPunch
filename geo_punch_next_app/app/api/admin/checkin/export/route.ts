import { db } from "@/utils/prisma";
import { attendanceReportFilename, createAttendanceReport } from "@/utils/attendanceReport";
import { withAdminAuth } from "../../../_utils/auth";
import { attendanceReportFilters } from "@/utils/attendanceReportFilters";

export const runtime = "nodejs";

async function exportAttendance(request: Request): Promise<Response> {
  let where;
  try {
    where = attendanceReportFilters(new URL(request.url).searchParams);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid filters" }, { status: 400 });
  }
  try {
    const records = await db.attendance_record.findMany({
      where,
      select: {
        submitted_at: true, address: true, latitude: true, longitude: true, status: true,
        employees: { select: {
          name: true,
          designations: { select: { designations: true } },
          departments: { select: { department_name: true } },
        } },
        office_locations: { select: {
          address: true, latitude: true, longitude: true,
          offices: { select: { name: true } },
        } },
      },
      orderBy: [{ submitted_at: "desc" }, { id: "desc" }],
    });
    const buffer = await createAttendanceReport(records);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${attendanceReportFilename()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Attendance report export failed", error);
    return Response.json({ error: "Could not generate the attendance report. Please try again." }, { status: 500 });
  }
}

export const GET = withAdminAuth(exportAttendance);
