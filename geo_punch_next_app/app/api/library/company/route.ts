import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";
import { withAdminAuth } from "../../_utils/auth";
import { parseFormBody } from "@/app/api/_utils/formBody";
import { companySchema } from "@/app/(authed)/library/company/schema";

async function listCompanies(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const search = searchParams.get("search") || "";

    const companies = await db.company.findMany({
        where: {
            name: {
                contains: search,
                mode: "insensitive",
            },
        },
        orderBy: { id: "asc" },
        skip: page * 10,
        take: 10,
    });

    const count = await db.company.count({
        where: {
            name: {
                contains: search,
                mode: "insensitive",
            },
        },
    });

    return Response.json({ companies, count });
}

async function createCompany(request: Request): Promise<Response> {
    const parsed = await parseFormBody(request, companySchema);
    if (parsed.response) return parsed.response;
    const { name } = parsed.data;

    try {
        const newCompany = await db.company.create({
            data: {
                name,
            },
        });
        return new Response(JSON.stringify(newCompany), { status: 201 });
    }
    catch (error) {
        console.error("Error creating company:", error);
        const err = handlePrismaError(error);

        return new Response(
            JSON.stringify({ message: err.message }),
            { status: 400 }
        );
    }
}

export const GET = withAdminAuth(listCompanies);
export const POST = withAdminAuth(createCompany);
