import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";

export async function GET():Promise<Response>  {
    const companies = await db.company.findMany();

    return Response.json(companies);
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
    throw handlePrismaError(error);
    }
}