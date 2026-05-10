import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    
    const office = await db.offices.findUnique({
        where: {
            id: id
        },
        select: {
            id: true,
            name: true,
            company_id: true,
            office_locations: {
                select: {
                    id: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                }
            }
        }
    });

    if (!office) {
        return new Response("Office not found", { status: 404 });
    }

    return new Response(JSON.stringify(office), { status: 200 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    const { name, company_id, locations } = await request.json();

    if (!name || typeof name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    console.log(locations);

    try {
        return await db.$transaction(async (tx) => {
            const updatedOffice = await db.offices.update({
                where: {
                    id: id
                },
                data: {
                    name: name,
                    company_id: company_id  
                },
            });

            const existingLocations = await tx.office_locations.findMany({
                where: {
                    office_id: id
                }
            });

            const locationsToDelete = existingLocations.filter((loc) => !locations.some((l: any) => l.id === loc.id));

            // Delete locations that are no longer in the updated list
            for (const loc of locationsToDelete) {
                await tx.office_locations.delete({
                    where: { id: loc.id }
                });
            }

            if (locations && Array.isArray(locations)) {
                for(const loc of locations) {
                    if (loc.id) {
                        // Update existing location
                        await tx.office_locations.update({
                            where: { id: loc.id },
                            data: {
                                address: loc.address,
                                latitude: loc.lat,
                                longitude: loc.lng,
                            },
                        });
                    } else {
                        // Create new location
                        await tx.office_locations.create({
                            data: {
                                office_id: id,
                                address: loc.address,
                                latitude: loc.lat,
                                longitude: loc.lng,
                            },
                        });
                    }
                }
            }
            return new Response(JSON.stringify(updatedOffice), { status: 200 });
        })
    }
    catch (error) {
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    try {
        await db.offices.delete({
            where: {
                id: id
            },
        });
        return new Response("Office deleted successfully", { status: 200 });
    }
    catch (error) {
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}