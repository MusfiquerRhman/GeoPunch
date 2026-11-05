import { NextResponse } from "next/server";
import { db } from "@/utils/prisma";
import { getUserFromRequest } from "../../_utils/auth";
import { protectedSelfieUrl } from "../../_utils/attendanceFiles";
import { submitAttendance } from "./_submitAttendance";

export async function POST(req: Request) {
  return submitAttendance(req);
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const records = await db.attendance_record.findMany({
      where: { employee_id: user.id },
      orderBy: { submitted_at: "desc" },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        selfie_url: true,
        submitted_at: true,
        status: true,
        address: true,
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: records.map((record) => ({
        ...record,
        selfie_url: protectedSelfieUrl(record.selfie_url),
      })),
    });
  } catch (error) {
    console.error("GET attendance error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch attendance records" }, { status: 500 });
  }
}
