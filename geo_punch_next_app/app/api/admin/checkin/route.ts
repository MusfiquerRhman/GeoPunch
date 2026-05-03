import { db } from "@/utils/prisma";

export async function GET(): Promise<Response> {
    const data = await db.attendance_record.findMany({
        select: {
            id: true,
            latitude: true,
            longitude: true,
            selfie_url: true,
            submitted_at: true,
            status: true,
            address: true,
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
    });

    const records = data.map((record) => ({
        id: record.id,
        latitude: record.latitude,
        longitude: record.longitude,
        selfie_url: record.selfie_url,
        submitted_at: record.submitted_at,
        status: record.status,
        address: record.address,
        employee: {
            id: record.employees?.id,
            name: record.employees?.name,
            id_card_no: record.employees?.id_card_no,
        }
    }));


    return Response.json({ records });
}
