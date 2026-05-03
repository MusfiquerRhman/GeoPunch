import { db } from "@/utils/prisma";

export async function GET():Promise<Response>  {
    const departments = await db.departments.findMany();

    return Response.json(departments);
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
        return new Response("Internal Server Error", { status: 500 });
    }
}