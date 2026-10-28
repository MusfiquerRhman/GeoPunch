import { db } from "@/utils/prisma";
import type { z } from "zod";
import type { officeSchema } from "@/app/(authed)/library/offices/schema";

export const officeSelect = {
    id: true, name: true, company_id: true,
    office_locations: {
        select: { id: true, address: true, latitude: true, longitude: true },
        orderBy: { id: "asc" },
    },
} as const;

export class OfficeFormError extends Error {}

export async function saveOffice(data: z.output<typeof officeSchema>, id?: string) {
    return db.$transaction(async (tx) => {
        if (!id) {
            if (data.locations.some((location) => location.id)) {
                throw new OfficeFormError("New office locations cannot reuse existing location IDs");
            }
            return tx.offices.create({
                data: {
                    name: data.name, company_id: data.company_id,
                    office_locations: {
                        create: data.locations.map((location) => ({
                            address: location.address, latitude: location.lat, longitude: location.lng,
                        })),
                    },
                },
                select: officeSelect,
            });
        }

        const existing = await tx.office_locations.findMany({
            where: { office_id: id },
            select: { id: true, _count: { select: { attendance_record: true } } },
        });
        if (data.locations.some((location) => location.id && !existing.some((saved) => saved.id === location.id))) {
            throw new OfficeFormError("An office location does not belong to this office. Reload and try again.");
        }
        const removed = existing.filter((saved) => !data.locations.some((location) => location.id === saved.id));
        if (removed.some((location) => location._count.attendance_record > 0)) {
            throw new OfficeFormError("A location with attendance records cannot be removed. Keep it and update its address or position instead.");
        }

        await tx.offices.update({ where: { id }, data: { name: data.name, company_id: data.company_id } });
        if (removed.length) {
            await tx.office_locations.deleteMany({ where: { office_id: id, id: { in: removed.map((location) => location.id) } } });
        }
        for (const location of data.locations) {
            const locationData = { address: location.address, latitude: location.lat, longitude: location.lng };
            if (location.id) {
                await tx.office_locations.update({ where: { id: location.id, office_id: id }, data: locationData });
            } else {
                await tx.office_locations.create({ data: { ...locationData, office_id: id } });
            }
        }
        // Return generated IDs as well, so a second save updates newly added locations.
        return tx.offices.findUniqueOrThrow({ where: { id }, select: officeSelect });
    });
}
