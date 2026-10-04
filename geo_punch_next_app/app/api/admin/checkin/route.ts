import { db } from "@/utils/prisma";
import { withAdminAuth } from "../../_utils/auth";
import { protectedSelfieUrl } from "../../_utils/attendanceFiles";

async function listCheckIns(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 0);
    const status = Number(searchParams.get("status") ?? 1);
    if (!Number.isInteger(page) || page < 0 || ![0, 1, 2].includes(status)) {
        return Response.json({ error: "Invalid page or status" }, { status: 400 });
    }

    const data = await db.attendance_record.findMany({
        where: {
            status,
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
        selfie_url: protectedSelfieUrl(record.selfie_url),
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

export const GET = withAdminAuth(listCheckIns);
