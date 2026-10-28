import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/utils/prisma";
import { getUserFromRequest } from "../../_utils/auth";
import { protectedSelfieUrl } from "../../_utils/attendanceFiles";
import { haversineDistance } from "../../_utils/haversine_algorithm";

const MAX_SELFIE_BYTES = 5 * 1024 * 1024;

function detectImageType(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

const extensionForType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.company_id) return NextResponse.json({ error: "Employee is not assigned to a company" }, { status: 403 });

  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_SELFIE_BYTES + 256 * 1024) {
    return NextResponse.json({ error: "Attendance upload is too large" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart request" }, { status: 400 });
  }

  const file = formData.get("photo");
  const latitudeValue = formData.get("latitude");
  const longitudeValue = formData.get("longitude");
  const addressValue = formData.get("address");
  const address = typeof addressValue === "string" ? addressValue.trim() || null : null;
  const latitude = typeof latitudeValue === "string" && latitudeValue.trim() !== "" ? Number(latitudeValue) : NaN;
  const longitude = typeof longitudeValue === "string" && longitudeValue.trim() !== "" ? Number(longitudeValue) : NaN;
  if (
    !(file instanceof File) ||
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    return NextResponse.json({ error: "Invalid attendance details" }, { status: 400 });
  }
  if (file.size < 1 || file.size > MAX_SELFIE_BYTES) {
    return NextResponse.json({ error: "Selfie must be no larger than 5 MB" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = detectImageType(buffer);
  if (!contentType || (file.type && file.type !== contentType)) {
    return NextResponse.json({ error: "Selfie must be a valid JPEG, PNG, or WebP image" }, { status: 415 });
  }

  const offices = await db.offices.findMany({
    where: { company_id: user.company_id },
    select: {
      name: true,
      office_locations: { select: { id: true, address: true, latitude: true, longitude: true } },
    },
  });
  const locations = offices.flatMap((office) => office.office_locations.map((location) => ({
    ...location,
    office_name: office.name,
  })));
  const nearest = locations
    .map((office) => ({
      ...office,
      distance: haversineDistance(
        { lat: latitude, lng: longitude },
        { lat: office.latitude, lng: office.longitude },
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  const uploadDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "attendance-uploads");
  const fileName = `${randomUUID()}.${extensionForType[contentType]}`;
  const filePath = path.join(uploadDir, fileName);
  await mkdir(uploadDir, { recursive: true });

  try {
    await writeFile(filePath, buffer, { flag: "wx" });
    await db.attendance_record.create({
      data: {
        employee_id: user.id,
        latitude,
        longitude,
        // The address comes from client-side reverse geocoding and is not proof
        // of location. Store it for display alongside the coordinates and distance.
        address,
        selfie_url: `/api/geo_punch/uploads/${fileName}`,
        nearest_office_location: nearest?.id ?? null,
        distance: nearest?.distance ?? null,
      },
    });
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    console.error("Attendance submission failed:", error);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
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
