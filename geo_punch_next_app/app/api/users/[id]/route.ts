import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    
    const employee = await db.employees.findUnique({
        where: {
            id: id
        }
    });

    if (!employee) {
        return new Response("Employee not found", { status: 404 });
    }

    return new Response(JSON.stringify(employee), { status: 200 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    const { id_card_no, name, email, department_id, designation_id, company_id, phone_no, isActive, password, isAdmin} = await request.json();

    if (!name || typeof name !== "string") {
        return new Response("Invalid input", { status: 400 });
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
                departments: {
                    connect: {
                        id: department_id
                    }
                },
                designations: {
                    connect: {
                        id: designation_id
                    }
                },
                company: {
                    connect: {
                        id: company_id
                    }
                },
                phone_no: phone_no,
                is_active: isActive,
                password: password,
                is_admin: isAdmin,
            },
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

export async function DELETE(request: Request, { params }: { params: { id: string } }): Promise<Response> {
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