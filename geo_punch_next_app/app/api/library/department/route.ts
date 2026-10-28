import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";
import { withAdminAuth } from "../../_utils/auth";
import { parseFormBody } from "@/app/api/_utils/formBody";
import { departmentSchema } from "@/app/(authed)/library/departments/schema";

async function listDepartments(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const search = searchParams.get("search") || "";

    const departments = await db.departments.findMany({
        orderBy: { id: "asc" },
        skip: page * 10,
        take: 10,
        where: {
            department_name: {
                contains: search,
                mode: "insensitive",
            },
        },
    });

    const count = await db.departments.count({
        where: {
            department_name: {
                contains: search,
                mode: "insensitive",
            },
        },
    });

    return Response.json({ departments, count });
}

async function createDepartment(req: Request): Promise<Response> {
    const parsed = await parseFormBody(req, departmentSchema);
    if (parsed.response) return parsed.response;
    const { department_name } = parsed.data;

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
        const err = handlePrismaError(error, "Department name already exists. Please use a different name.");

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

export const GET = withAdminAuth(listDepartments);
export const POST = withAdminAuth(createDepartment);
