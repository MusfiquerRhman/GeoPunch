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

    console.log("Updating office with data:", { id, name, company_id, locations });

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

            if (locations && Array.isArray(locations)) {
                // Delete existing locations
                await db.office_locations.deleteMany({
                    where: {
                        office_id: id
                    }
                });

                // Create new locations
                const locationData = locations.map((loc: any) => ({
                    latitude: loc.lat,
                    longitude: loc.lng,
                    address: loc.address,
                    office_id: id
                }));

                await db.office_locations.createMany({
                    data: locationData
                });
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