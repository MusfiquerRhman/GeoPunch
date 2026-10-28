import { handlePrismaError } from "@/app/api/_utils/handlePrismaError";
import { db } from "@/utils/prisma";
import { withAdminAuth } from "../../../_utils/auth";
import { parseFormBody } from "../../../_utils/formBody";
import { officeSchema } from "@/app/(authed)/library/offices/schema";
import { officeSelect, saveOffice, OfficeFormError } from "../_utils";

type Context = { params: Promise<{ id: string }> };

async function getOffice(_request: Request, { params }: Context): Promise<Response> {
    const { id } = await params;
    const office = await db.offices.findUnique({ where: { id }, select: officeSelect });
    if (!office) return Response.json({ message: "Office not found" }, { status: 404 });
    return Response.json(office);
}

async function updateOffice(request: Request, { params }: Context): Promise<Response> {
    const { id } = await params;
    const parsed = await parseFormBody(request, officeSchema);
    if (parsed.response) return parsed.response;
    try {
        return Response.json(await saveOffice(parsed.data, id));
    } catch (error) {
        const err = error instanceof OfficeFormError ? error : handlePrismaError(error);
        return Response.json({ message: err.message }, { status: 400 });
    }
}

async function deleteOffice(_request: Request, { params }: Context): Promise<Response> {
    const { id } = await params;
    try {
        await db.offices.delete({ where: { id } });
        return new Response("Office deleted successfully", { status: 200 });
    } catch (error) {
        const err = handlePrismaError(error);
        return Response.json({ message: err.message }, { status: 400 });
    }
}

export const GET = withAdminAuth(getOffice);
export const PUT = withAdminAuth(updateOffice);
export const DELETE = withAdminAuth(deleteOffice);
