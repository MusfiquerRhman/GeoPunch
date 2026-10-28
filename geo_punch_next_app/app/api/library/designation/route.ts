import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";
import { withAdminAuth } from "../../_utils/auth";
import { parseFormBody } from "@/app/api/_utils/formBody";
import { designationSchema } from "@/app/(authed)/library/designations/schema";

async function listDesignations(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const search = searchParams.get("search") || "";

    const designations = await db.designations.findMany({
        orderBy: { id: "asc" },
        skip: page * 10,
        take: 10,
        where: {
            designations: {
                contains: search,
                mode: "insensitive",
            },
        },
    });

    const count = await db.designations.count({
        where: {
            designations: {
                contains: search,
                mode: "insensitive",
            },
        },
    });

    return Response.json({ designations, count });
}

async function createDesignation(req: Request): Promise<Response> {
    const parsed = await parseFormBody(req, designationSchema);
    if (parsed.response) return parsed.response;
    const { designation } = parsed.data;

    try {
        const newDesignation = await db.designations.create({
            data: {
                designations: designation,
            },
        });
        return Response.json(newDesignation, { status: 201 });
    } catch (error) {
        console.error("Error creating designation:", error);
        const err = handlePrismaError(error, "Designation already exists. Please use a different name.");

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

export const GET = withAdminAuth(listDesignations);
export const POST = withAdminAuth(createDesignation);
