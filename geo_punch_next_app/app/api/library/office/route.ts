import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";

export async function GET(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    
    const offices = await db.offices.findMany({
        skip: page * 10,
        take: 10,
        select: {
            id: true,
            name: true,
            company: {
                select: {
                    name: true
                }
            }
        }
    });

    const count = await db.offices.count();

    return Response.json({ offices, count });
}

export async function POST(req: Request): Promise<Response> {
    const { name, company_id, locations } = await req.json();

    if (!name || typeof name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        return await db.$transaction(async (tx) => {
            const newOffice = await tx.offices.create({
                data: {
                    name: name,
                    company_id: company_id
                },
            });

            const locationData = locations.map((loc: any) => ({
                address: loc.address,
                latitude: loc.lat,
                longitude: loc.lng,
                office_id: newOffice.id,
            }));

            await tx.office_locations.createMany({
                data: locationData
            });

            return Response.json({newOffice, locationData}, { status: 201 });
        })
        
    } catch (error) {
        console.error("Error creating office:", error);
        console.error("Error details:", error instanceof Error ? error.message : error);
        
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}