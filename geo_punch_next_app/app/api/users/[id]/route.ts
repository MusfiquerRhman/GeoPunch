import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import { withAdminAuth } from "../../_utils/auth";

async function getUser(request: Request,  { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    
    const employee = await db.employees.findUnique({
        where: {
            id: id
        },
        select: {
            id: true, id_card_no: true, name: true, email: true, phone_no: true,
            is_active: true, is_admin: true, department_id: true, designation_id: true, company_id: true,
        },
    });

    if (!employee) {
        return new Response("Employee not found", { status: 404 });
    }

    return new Response(JSON.stringify(employee), { status: 200 });
}

async function updateUser(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    let data: any;
    try {
        data = await request.json();
    } catch {
        return Response.json({ message: "Invalid request body" }, { status: 400 });
    }
    const { id_card_no, name, email, department_id, designation_id, company_id, phone_no, isActive, password, isAdmin } = data;

    if (!name || typeof name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }
    if (typeof password !== "string" || (password.length > 0 && password.length < 8)) {
        return Response.json({ message: "A new password must be at least 8 characters" }, { status: 400 });
    }

    try {
        const updatedEmployee = await db.employees.update({
            where: {
                id: id
            },
            data: {
                id_card_no: id_card_no,
                name: name,
                email: email,
                departments: department_id ? { connect: { id: department_id } } : { disconnect: true },
                designations: designation_id ? { connect: { id: designation_id } } : { disconnect: true },
                company: company_id ? { connect: { id: company_id } } : { disconnect: true },
                phone_no: phone_no,
                is_active: isActive,
                ...(password ? { hashed_password: await bcrypt.hash(password, 12), password: null } : {}),
                is_admin: isAdmin,
            },
            select: { id: true, name: true, id_card_no: true, email: true, is_admin: true, is_active: true },
        });
        
        return new Response(JSON.stringify(updatedEmployee), { status: 200 });
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
