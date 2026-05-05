import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";

export async function GET():Promise<Response>  {
    const designations = await db.designations.findMany();

    return Response.json(designations);
}

export async function POST(req: Request): Promise<Response> {
    const { name } = await req.json();

    if (!name || typeof name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        const newDesignation = await db.designations.create({
            data: {
                designations: name ,
            },
        });
        return Response.json(newDesignation, { status: 201 });
    } catch (error) {
        console.error("Error creating designation:", error);
    throw handlePrismaError(error);
    }
}