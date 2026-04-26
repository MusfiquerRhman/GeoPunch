import { db } from "@/utils/prisma";

export async function POST(request: Request): Promise<Response> {
  const data = await request.json();

    try { 
        const res = await db.attendance_record.update({
            where: {
                id: data.id,
            },
            data: {
                status: 0, // rejected
            },
        });

        console.log("DB Update Result:", res);
    } catch (error) {
        console.error("Error rejecting check-in:", error);
        return Response.json({ error: "Failed to reject check-in" }, { status: 500 });
    }

  return Response.json({ message: 'Check-in rejected successfully' });
}