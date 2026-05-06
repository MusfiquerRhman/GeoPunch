import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";

export async function GET(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");

    const companies = await db.company.findMany({
        skip: page * 10,
        take: 10,
    });

    const count = await db.company.count();

    return Response.json({ companies, count });
}

export async function POST(request: Request): Promise<Response> {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        const newCompany = await db.company.create({
            data: {
                name,
            },
        });
        return new Response(JSON.stringify(newCompany), { status: 201 });
    }
    catch (error) {
        console.error("Error creating company:", error);
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}