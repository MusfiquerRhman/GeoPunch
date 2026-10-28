import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";
import { withAdminAuth } from "../../../_utils/auth";
import { parseFormBody } from "@/app/api/_utils/formBody";
import { departmentSchema } from "@/app/(authed)/library/departments/schema";

async function getDepartment(request: Request,  { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    
    const department = await db.departments.findUnique({
        where: {
            id: id
        }
    });

    if (!department) {
        return Response.json({ message: "Department not found" }, { status: 404 });
    }

    return new Response(JSON.stringify(department), { status: 200 });
}



async function updateDepartment(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    const parsed = await parseFormBody(request, departmentSchema);
    if (parsed.response) return parsed.response;
    const { department_name } = parsed.data;

    try {
        const updatedDepartment = await db.departments.update({
            where: {
                id: id
            },
            data: {
                department_name,
            },
        });
        return new Response(JSON.stringify(updatedDepartment), { status: 200 });
    }
    catch (error) {
        console.error("Error updating department:", error);
        const err = handlePrismaError(error, "Department name already exists. Please use a different name.");

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

async function deleteDepartment(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    try {
        await db.departments.delete({
            where: {
                id: id
            },
        });
        return new Response("Department deleted successfully", { status: 200 });
    }
    catch (error) {
        console.error("Error deleting department:", error);
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

export const GET = withAdminAuth(getDepartment);
export const PUT = withAdminAuth(updateDepartment);
export const DELETE = withAdminAuth(deleteDepartment);
