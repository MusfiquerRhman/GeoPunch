import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";
import { verifyToken } from "../../_utils/jwt";
import { NextResponse } from "next/dist/server/web/spec-extension/response";

export async function GET(req: Request): Promise<Response> {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    const payload: any = await verifyToken(token);

    const employee_id = payload.id; 

    try {
        const offices = await db.$queryRaw<{
            latitude: number;
            longitude: number;
            office_address: string;
            office_name: string;
            office_location_id: number;
        }[]>`
            SELECT
                ol.LATITUDE,
                ol.LONGITUDE,
                ol.address,
                o.name,
                ol.id
            FROM office_locations as ol
                inner join offices as o on o.id = ol.office_id
                inner join company as c on c.id = o.company_id
                inner join employees as e on e.company_id = c.id
            where e.id = ${employee_id};
        `;

        console.log("Offices:", offices);
        return Response.json({ offices, success: true, });
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