import { db } from "@/utils/prisma";
import { handlePrismaError } from "../../_utils/handlePrismaError";
import { withAdminAuth } from "../../_utils/auth";
import { parseFormBody } from "../../_utils/formBody";
import { officeSchema } from "@/app/(authed)/library/offices/schema";
import { saveOffice, OfficeFormError } from "./_utils";

async function listOffices(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const search = searchParams.get("search") || "";

    const offices = await db.offices.findMany({
        orderBy: { id: "asc" },
        skip: page * 10,
        take: 10,

        select: {
            id: true,
            name: true,
            company: {
                select: {
                    name: true,
                },
            },
        },

        where: {
            OR: [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },

                {
                    company: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                },

                {
                    office_locations: {
                        some: {
                            address: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    },
                },
            ],
        },
    });

    const count = await db.offices.count({
        where: {
            OR: [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },

                {
                    company: {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                },

                {
                    office_locations: {
                        some: {
                            address: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    },
                },
            ],
        },
    });

    return Response.json({ offices, count });
}

async function createOffice(req: Request): Promise<Response> {
    const parsed = await parseFormBody(req, officeSchema);
    if (parsed.response) return parsed.response;

    try {
        return Response.json(await saveOffice(parsed.data), { status: 201 });
    } catch (error) {
        const err = error instanceof OfficeFormError ? error : handlePrismaError(error);
        return Response.json({ message: err.message }, { status: 400 });
    }
}

export const GET = withAdminAuth(listOffices);
export const POST = withAdminAuth(createOffice);
