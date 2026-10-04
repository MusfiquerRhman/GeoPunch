import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../_utils/auth";
import { db } from "@/utils/prisma";

export async function GET(req: Request) {
    try {
        const authenticatedEmployee = await getUserFromRequest(req);
        if (!authenticatedEmployee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userDetailsObj = await db.employees.findUnique({
            where: {
                id: authenticatedEmployee.id,
            },
            select: {
                name: true,
                email: true,
                id_card_no: true,
                departments: {
                    select: {
                        department_name: true,
                    },
                },
                designations: {
                    select: {
                        designations: true,
                    },
                },
                phone_no: true,
            },
        });

        const user = userDetailsObj ? {
            name: userDetailsObj.name,
            email: userDetailsObj.email,
            id_card_no: userDetailsObj.id_card_no,
            department: userDetailsObj.departments?.department_name || null,
            designation: userDetailsObj.designations?.designations || null,
            phone_no: userDetailsObj.phone_no,
        } : null;

        return NextResponse.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error("GET attendance error:", error);
    
        return NextResponse.json(
          {
            success: false,
            message: "Failed to fetch attendance records",
          },
          { status: 500 }
        );
      }
}
