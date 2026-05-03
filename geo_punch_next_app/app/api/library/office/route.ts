import { db } from "@/utils/prisma";

export async function GET():Promise<Response>  {
    const designations = await db.offices.findMany();

    console.log("Fetched designations from database:", designations);

    return Response.json(designations);
}

export async function POST(req: Request): Promise<Response> {
    const { designation, company_id } = await req.json();

    if (!designation || typeof designation !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        const newDesignation = await db.offices.create({
            data: {
                name: designation,
                company_id: company_id
            },
        });
        return Response.json(newDesignation, { status: 201 });
    } catch (error) {
        console.error("Error creating designation:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}