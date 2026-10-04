import { NextResponse } from "next/server";
import { db } from "@/utils/prisma";
import { getUserFromRequest } from "../../_utils/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.company_id) return NextResponse.json({ error: "Employee is not assigned to a company" }, { status: 403 });

  const offices = await db.offices.findMany({
    where: { company_id: user.company_id },
    select: {
      name: true,
      office_locations: {
        select: { id: true, address: true, latitude: true, longitude: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    success: true,
    offices: offices.flatMap((office) => office.office_locations.map((location) => ({
      id: location.id,
      name: office.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    }))),
  });
}
