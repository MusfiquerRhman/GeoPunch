import { db } from "@/utils/prisma";

export async function GET(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const status = searchParams.get("status");

    const data = await db.attendance_record.findMany({
        where: {
            status: status === "1" ? 1 : status === "2" ? 2 : 0,
        },
        select: {
            id: true,
            latitude: true,
            longitude: true,
            selfie_url: true,
            submitted_at: true,
            status: true,
            address: true,
            distance: true,
            office_locations: {
                select: {
                    id: true,
                    address: true,
                    offices: {
                        select: {
                            name: true,
                        }
                    }
                }
            },
            employees: {
                select: {
                    id: true,
                    name: true,
                    id_card_no: true,
                }
            }
        },
        orderBy: {
            submitted_at: "desc",
        },
        skip: page * 10,
        take: 10,
    });

    const records = data.map((record) => ({
        id: record.id,
        latitude: record.latitude,
        longitude: record.longitude,
        selfie_url: record.selfie_url,
        submitted_at: record.submitted_at,
        status: record.status,
        address: record.address,
        distance: record.distance,
        nearest_office_address: record.office_locations?.address ?? null,
        nearest_office_name: record.office_locations?.offices?.name ?? null,
        employee: {
            id: record.employees?.id,
            name: record.employees?.name,
            id_card_no: record.employees?.id_card_no,
        },
    }));


    return Response.json({ records });
}
