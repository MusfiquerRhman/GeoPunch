import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";
import { withAdminAuth } from "../../../_utils/auth";
import { parseFormBody } from "@/app/api/_utils/formBody";
import { companySchema } from "@/app/(authed)/library/company/schema";

async function getCompany(request: Request,  { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    
    const company = await db.company.findUnique({
        where: {
            id: id
        }
    });

    if (!company) {
        return Response.json({ message: "Company not found" }, { status: 404 });
    }

    return new Response(JSON.stringify(company), { status: 200 });
}

async function updateCompany(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    const parsed = await parseFormBody(request, companySchema);
    if (parsed.response) return parsed.response;
    const { name } = parsed.data;

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
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

async function deleteCompany(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
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
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

export const GET = withAdminAuth(getCompany);
export const PUT = withAdminAuth(updateCompany);
export const DELETE = withAdminAuth(deleteCompany);
