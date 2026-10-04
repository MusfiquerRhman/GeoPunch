import { NextResponse } from "next/server";
import { db } from "@/utils/prisma";
import { getUserFromRequest } from "../../_utils/auth";
import { haversineDistance } from "../../_utils/haversine_algorithm";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.company_id) return NextResponse.json({ error: "Employee is not assigned to a company" }, { status: 403 });

  let coordinates: { latitude?: unknown; longitude?: unknown };
  try {
    coordinates = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { latitude, longitude } = coordinates;
  if (
    typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
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

  if (!nearest) return NextResponse.json({ success: false, message: "No office locations configured" }, { status: 404 });
  return NextResponse.json({
    success: true,
    nearest_office: {
      distance: nearest.distance,
      office_address: nearest.address,
      office_name: nearest.office_name,
      office_location_id: nearest.id,
    },
  });
}
