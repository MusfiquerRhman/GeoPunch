import { NextResponse } from "next/server";
import { db } from "@/utils/prisma";
import { historyMonthBounds, HISTORY_PAGE_SIZE } from "@/utils/employeeHistory";
import { getUserFromRequest } from "../../_utils/auth";
import { protectedSelfieUrl } from "../../_utils/attendanceFiles";

const select = {
  id: true, latitude: true, longitude: true, selfie_url: true,
  submitted_at: true, status: true, address: true, notes: true,
} as const;
const headers = { "Cache-Control": "private, no-store", Vary: "Authorization, Cookie" };

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const params = new URL(req.url).searchParams;
  const month = params.get("month");
  const cursor = params.get("cursor");
  let submitted_at;
  try {
    if (month !== null) submitted_at = historyMonthBounds(month);
    if (cursor !== null && (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor) || month !== null)) {
      throw new Error("Invalid punch list cursor.");
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400, headers });
  }

  try {
    if (cursor && !await db.attendance_record.findFirst({ where: { id: cursor, employee_id: user.id }, select: { id: true } })) {
      return NextResponse.json({ error: "This punch list has changed. Refresh to continue." }, { status: 400, headers });
    }
    const records = await db.attendance_record.findMany({
      where: { employee_id: user.id, ...(submitted_at ? { submitted_at } : {}) },
      // The ID provides a stable order when punches share a timestamp.
      orderBy: [{ submitted_at: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      select,
      ...(month === null ? { take: HISTORY_PAGE_SIZE + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) } : {}),
    });
    const hasMore = month === null && records.length > HISTORY_PAGE_SIZE;
    const page = hasMore ? records.slice(0, HISTORY_PAGE_SIZE) : records;
    return NextResponse.json({
      success: true,
      data: page.map(record => ({ ...record, selfie_url: protectedSelfieUrl(record.selfie_url) })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    }, { headers });
  } catch (error) {
    console.error("Employee history error:", error);
    return NextResponse.json({ error: "Could not load your punches. Please try again." }, { status: 500, headers });
  }
}
