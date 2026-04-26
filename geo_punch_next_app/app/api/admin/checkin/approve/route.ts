import { db } from "@/utils/prisma";


export async function POST(request: Request): Promise<Response> {
  const data = await request.json();

    try { 
        const res = await db.attendance_record.update({
            where: {
                id: data.id,
            },
            data: {
                status: 2, // approved
            },
        });

        console.log("DB Update Result:", res);
    } catch (error) {
        console.error("Error approving check-in:", error);
        return Response.json({ error: "Failed to approve check-in" }, { status: 500 });
    }

  return Response.json({ message: 'Check-in approved successfully' });
}