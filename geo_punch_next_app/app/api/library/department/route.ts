import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";

export async function GET(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");

    const departments = await db.departments.findMany({
        skip: page * 10,
        take: 10,
    });

    const count = await db.departments.count();

    return Response.json({ departments, count });
}

export async function POST(req: Request): Promise<Response> {
    const { department_name } = await req.json();

    if (!department_name || typeof department_name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        const newDepartment = await db.departments.create({
            data: {
                department_name,
            },
        });
        return Response.json(newDepartment, { status: 201 });
    }
    catch (error) {
        console.error("Error creating department:", error);
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}