import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";

export async function GET(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");

    const designations = await db.designations.findMany({
        skip: page * 10,
        take: 10,
    });

    const count = await db.designations.count();

    return Response.json({ designations, count });
}

export async function POST(req: Request): Promise<Response> {
    const { designation } = await req.json();

    if (!designation || typeof designation !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        const newDesignation = await db.designations.create({
            data: {
                designations: designation,
            },
        });
        return Response.json(newDesignation, { status: 201 });
    } catch (error) {
        console.error("Error creating designation:", error);
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}