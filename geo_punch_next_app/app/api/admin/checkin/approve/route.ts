import { db } from "@/utils/prisma";
import { withAdminAuth } from "../../../_utils/auth";

async function approveCheckIn(request: Request): Promise<Response> {
  let data: { id?: unknown };
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof data.id !== "string") return Response.json({ error: "Invalid record ID" }, { status: 400 });

  try {
    const result = await db.attendance_record.updateMany({
      where: { id: data.id, status: 1 },
      data: { status: 2 },
    });
    if (result.count === 0) {
      const exists = await db.attendance_record.findUnique({ where: { id: data.id }, select: { id: true } });
      return Response.json(
        { error: exists ? "Only pending attendance can be approved" : "Attendance record not found" },
        { status: exists ? 409 : 404 },
      );
    }
    return Response.json({ message: "Check-in approved successfully" });
  } catch (error) {
    console.error("Error approving check-in:", error);
    return Response.json({ error: "Failed to approve check-in" }, { status: 500 });
  }
}

export const POST = withAdminAuth(approveCheckIn);
