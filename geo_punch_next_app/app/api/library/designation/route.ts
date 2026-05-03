import { db } from "@/utils/prisma";

export async function GET():Promise<Response>  {
    const designations = await db.company.findMany();

    return Response.json(designations);
}

export async function POST(req: Request): Promise<Response> {
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        const newDesignation = await db.company.create({
            data: {
                name: name ,
            },
        });
        return Response.json(newDesignation, { status: 201 });
    } catch (error) {
        console.error("Error creating designation:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}