import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";
import { withAdminAuth } from "../../../_utils/auth";
import { parseFormBody } from "@/app/api/_utils/formBody";
import { designationSchema } from "@/app/(authed)/library/designations/schema";

async function getDesignation(request: Request,  { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    
    const designation = await db.designations.findUnique({
        where: {
            id: id
        }
    });

    if (!designation) {
        return Response.json({ message: "Designation not found" }, { status: 404 });
    }

    return new Response(JSON.stringify(designation), { status: 200 });
}

async function updateDesignation(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const { id } = await params;
    const parsed = await parseFormBody(request, designationSchema);
    if (parsed.response) return parsed.response;
    const { designation } = parsed.data;

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
        const err = handlePrismaError(error, "Designation already exists. Please use a different name.");

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

async function deleteDesignation(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
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

export const GET = withAdminAuth(getDesignation);
export const PUT = withAdminAuth(updateDesignation);
export const DELETE = withAdminAuth(deleteDesignation);
