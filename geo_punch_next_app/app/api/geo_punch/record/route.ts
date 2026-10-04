import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/utils/prisma";
import { getUserFromRequest } from "../../_utils/auth";
import { protectedSelfieUrl } from "../../_utils/attendanceFiles";
import { haversineDistance } from "../../_utils/haversine_algorithm";

const MAX_SELFIE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RADIUS_METERS = Number(process.env.ATTENDANCE_RADIUS_METERS ?? 100);

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

  if (!Number.isFinite(ALLOWED_RADIUS_METERS) || ALLOWED_RADIUS_METERS <= 0) {
    console.error("ATTENDANCE_RADIUS_METERS must be a positive number");
    return NextResponse.json({ error: "Attendance location policy is not configured" }, { status: 500 });
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
  if (locations.length === 0) {
    return NextResponse.json({ error: "No office locations are configured for this company" }, { status: 409 });
  }

  const nearest = locations
    .map((office) => ({
      ...office,
      distance: haversineDistance(
        { lat: latitude, lng: longitude },
        { lat: office.latitude, lng: office.longitude },
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (nearest.distance > ALLOWED_RADIUS_METERS) {
    return NextResponse.json({
      error: "You are outside the permitted attendance area",
      distance: Math.round(nearest.distance),
      allowed_radius_meters: ALLOWED_RADIUS_METERS,
    }, { status: 403 });
  }

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
        // of location. Keep the server-verified coordinates and distance only.
        address: null,
        selfie_url: `/api/geo_punch/uploads/${fileName}`,
        nearest_office_location: nearest.id,
        distance: nearest.distance,
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
