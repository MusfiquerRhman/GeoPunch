import { db } from "@/utils/prisma";

export async function GET():Promise<Response>  {
    const departments = await db.departments.findMany();

    return Response.json(departments);
}