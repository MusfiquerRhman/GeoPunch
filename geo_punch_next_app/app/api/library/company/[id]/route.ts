import { db } from "@/utils/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    
    const company = await db.company.findUnique({
        where: {
            id: id
        }
    });

    if (!company) {
        return new Response("Company not found", { status: 404 });
    }

    return new Response(JSON.stringify(company), { status: 200 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
        return new Response("Invalid input", { status: 400 });
    }

    try {
        const updatedCompany = await db.company.update({
            where: {
                id: id
            },
            data: {
                name: name,
            },
        });
        return new Response(JSON.stringify(updatedCompany), { status: 200 });
    }
    catch (error) {
        console.error("Error updating company:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }): Promise<Response> {
    const { id } = await params;
    try {
        await db.company.delete({
            where: {
                id: id
            },
        });
        return new Response("Company deleted successfully", { status: 200 });
    }
    catch (error) {
        console.error("Error deleting company:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}