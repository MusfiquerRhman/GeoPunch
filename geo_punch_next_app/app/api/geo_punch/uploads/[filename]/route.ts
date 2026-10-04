import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/utils/prisma";
import { getUserFromRequest } from "../../../_utils/auth";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    return new Response(null, { status: 404 });
  }

  const legacyUrl = `/uploads/${filename}`;
  const privateUrl = `/api/geo_punch/uploads/${filename}`;
  const record = await db.attendance_record.findFirst({
    where: { OR: [{ selfie_url: privateUrl }, { selfie_url: legacyUrl }] },
    select: { employee_id: true, selfie_url: true },
  });
  if (!record || (!user.is_admin && record.employee_id !== user.id)) {
    return new Response(null, { status: 404 });
  }

  const actualPath = record.selfie_url === privateUrl
    ? path.join(
        process.env.ATTENDANCE_UPLOAD_DIR || path.join(process.cwd(), "data", "attendance-uploads"),
        filename,
      )
    : path.join(process.cwd(), "public", "uploads", filename);

  try {
    const image = await readFile(actualPath);
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": contentTypes[path.extname(filename).slice(1).toLowerCase()],
        "Content-Length": String(image.byteLength),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
