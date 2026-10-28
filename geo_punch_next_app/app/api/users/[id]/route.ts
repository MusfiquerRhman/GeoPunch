import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import { withAdminAuth } from "../../_utils/auth";
import { editUserSchema } from "@/app/(authed)/admin/users/schema";

const employeeSelect = {
    id: true, id_card_no: true, name: true, email: true, phone_no: true,
    is_active: true, is_admin: true, department_id: true, designation_id: true, company_id: true,
} as const;

async function getUser(request: Request,  { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    
    const employee = await db.employees.findUnique({
        where: {
            id: id
        },
        select: employeeSelect,
    });

    if (!employee) {
        return Response.json({ message: "Employee not found" }, { status: 404 });
    }

    return Response.json(employee);
}

async function updateUser(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ message: "Invalid request body" }, { status: 400 });
    }
    const result = editUserSchema.safeParse(body);
    if (!result.success) {
        return Response.json({ message: result.error.issues[0].message }, { status: 400 });
    }
    const { id_card_no, name, email, department_id, designation_id, company_id, phone_no, isActive, password, isAdmin } = result.data;

    try {
        const updatedEmployee = await db.employees.update({
            where: {
                id: id
            },
            data: {
                id_card_no: id_card_no,
                name: name,
                email: email,
                ...(department_id !== undefined ? {
                    departments: department_id ? { connect: { id: department_id } } : { disconnect: true },
                } : {}),
                ...(designation_id !== undefined ? {
                    designations: designation_id ? { connect: { id: designation_id } } : { disconnect: true },
                } : {}),
                ...(company_id !== undefined ? {
                    company: company_id ? { connect: { id: company_id } } : { disconnect: true },
                } : {}),
                phone_no: phone_no,
                is_active: isActive,
                ...(password ? { hashed_password: await bcrypt.hash(password, 12), password: null } : {}),
                is_admin: isAdmin,
            },
            select: employeeSelect,
        });
        
        return Response.json(updatedEmployee);
    }
    catch (error) {
        console.error("Error updating employee:", error);
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

async function deleteUser(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    try {
        await db.employees.delete({
            where: {
                id: id
            },
        });
        return new Response("Employee deleted successfully", { status: 200 });
    }
    catch (error) {
        console.error("Error deleting employee:", error);
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

export const GET = withAdminAuth(getUser);
export const PUT = withAdminAuth(updateUser);
export const DELETE = withAdminAuth(deleteUser);
