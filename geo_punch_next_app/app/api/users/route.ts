import { db } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import { handlePrismaError } from "../_utils/handlePrismaError";

export async function GET(): Promise<Response> {
  const data = await db.employees.findMany({
    select: {
      id: true,
      departments: {
        select: {
          id: true,
          department_name: true,
        }
      },
      designations: {
        select: {
          id: true,
          designations: true,
        }
      },
      company: {
        select: {
          id: true,
          name: true,
        }
      },
      id_card_no: true,
      name: true,
      phone_no: true,
      is_active: true,
      email: true,
      is_admin: true,
    },
  });

  const users = data.map((user) => ({
    id: user.id,
    id_card_no: user.id_card_no,
    name: user.name,
    phone_no: user.phone_no,
    is_active: user.is_active,
    email: user.email,
    is_admin: user.is_admin,
    department: user.departments?.department_name ?? null,
    designation: user.designations?.designations ?? null,
    company: user.company?.name ?? null,
  }));

  return Response.json({ users });
}

export async function POST(request: Request): Promise<Response> {
  const data = await request.json();

  // Here you would typically handle the data, e.g., save it to a database
  try {
    const res = await db.employees.create({
      data: {
        id_card_no: data.id_card_no,
        name: data.name,
        departments: {
          connect: { id: data.department_id },
        },
        company: {
          connect: { id: data.company_id },
        },
        designations: {
          connect: { id: data.designation_id },
        },
        phone_no: data.phone_no,
        is_active: data.isActive,
        email: data.email,
        password: data.password,
        hashed_password:  await bcrypt.hash(data.password, 10),
        is_admin: data.isAdmin,
      },
    })
    return Response.json({ message: 'User created successfully', user: res });
  } catch(error) {
    const err = handlePrismaError(error);

    return new Response(
      JSON.stringify({ message: err.message }),
      { status: 400 }
    );
  };
}