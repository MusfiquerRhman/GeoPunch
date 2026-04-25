import { db } from "@/utils/prisma";

export async function GET():Promise<Response>  {
    const designations = await db.designations.findMany();

    return Response.json(designations);
}