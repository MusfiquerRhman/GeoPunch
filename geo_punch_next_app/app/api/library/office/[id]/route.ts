import { db } from "@/utils/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    
    const office = await db.offices.findUnique({
        where: {
            id: id
        }
    });

    if (!office) {
        return new Response("Office not found", { status: 404 });
    }

    return new Response(JSON.stringify(office), { status: 200 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    const { name, company_id } = await request.json();

    if (!name || typeof name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        const updatedOffice = await db.offices.update({
            where: {
                id: id
            },
            data: {
                name: name,
                company_id: company_id  
            },
        });
        return new Response(JSON.stringify(updatedOffice), { status: 200 });
    }
    catch (error) {
        console.error("Error updating office:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    try {
        await db.offices.delete({
            where: {
                id: id
            },
        });
        return new Response("Office deleted successfully", { status: 200 });
    }
    catch (error) {
        console.error("Error deleting office:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}