import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    
    const designation = await db.designations.findUnique({
        where: {
            id: id
        }
    });

    if (!designation) {
        return new Response("Designation not found", { status: 404 });
    }

    return new Response(JSON.stringify(designation), { status: 200 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    const { designation } = await request.json();

    if (!designation || typeof designation !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        const updatedDesignation = await db.designations.update({
            where: {
                id: id
            },
            data: {
                designations: designation,
            },
        });
        return new Response(JSON.stringify(updatedDesignation), { status: 200 });
    }
    catch (error) {
        console.error("Error updating designation:", error);
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
        await db.designations.delete({
            where: {
                id: id
            },
        });
        return new Response("Designation deleted successfully", { status: 200 });
    }
    catch (error) {
        console.error("Error deleting designation:", error);
        const err = handlePrismaError(error);
        
        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}