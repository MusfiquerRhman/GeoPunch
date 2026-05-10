import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";
import { verifyToken } from "../../_utils/jwt";
import { NextResponse } from "next/dist/server/web/spec-extension/response";

interface NearestOffice {
    distance: number;
    office_address: string;
    office_name: string;
    office_location_id: number;
}

export async function POST(req: Request): Promise<Response> {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude || typeof latitude !== "number" || typeof longitude !== "number") {
        return new Response("Invalid input", { status: 400 });
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const payload: any = await verifyToken(token);

    const employee_id = payload.id; 

    try {
        const distance = await db.$queryRaw<NearestOffice[]>`
            SELECT
                (
                    6371000 * acos(
                        cos(radians(${latitude})) *
                        cos(radians(ol.LATITUDE)) *
                        cos(radians(ol.LONGITUDE) - radians(${longitude})) +
                        sin(radians(${latitude})) *
                        sin(radians(ol.LATITUDE))
                    )
                ) AS distance,
                ol.address as office_address,
                o.name as office_name,
                ol.id as office_location_id
            FROM office_locations as ol
                inner join offices as o on o.id = ol.office_id
                inner join company as c on c.id = o.company_id
                inner join employees as e on e.company_id = c.id
            where e.id = ${employee_id}
            ORDER BY distance
            LIMIT 1;
        `
        return Response.json({ nearest_office: distance[0], success: true, });
    }
    catch (error) {
        console.error("Error creating department:", error);
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}