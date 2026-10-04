import { db } from "@/utils/prisma";
import { withAdminAuth } from "../../../_utils/auth";

async function rejectCheckIn(request: Request): Promise<Response> {
  let data: { id?: unknown };
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof data.id !== "string") return Response.json({ error: "Invalid record ID" }, { status: 400 });

  try {
    const result = await db.attendance_record.updateMany({
      where: { id: data.id, status: { in: [1, 2] } },
      data: { status: 0 },
    });
    if (result.count === 0) {
      const exists = await db.attendance_record.findUnique({ where: { id: data.id }, select: { id: true } });
      return Response.json(
        { error: exists ? "Attendance record is already rejected" : "Attendance record not found" },
        { status: exists ? 409 : 404 },
      );
    }
    return Response.json({ message: "Check-in rejected successfully" });
  } catch (error) {
    console.error("Error rejecting check-in:", error);
    return Response.json({ error: "Failed to reject check-in" }, { status: 500 });
  }
}

export const POST = withAdminAuth(rejectCheckIn);
