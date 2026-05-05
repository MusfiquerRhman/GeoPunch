import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    
    const department = await db.departments.findUnique({
        where: {
            id: id
        }
    });

    if (!department) {
        return new Response("Department not found", { status: 404 });
    }

    return new Response(JSON.stringify(department), { status: 200 });
}


export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    const { department_name } = await request.json();

    if (!department_name || typeof department_name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

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