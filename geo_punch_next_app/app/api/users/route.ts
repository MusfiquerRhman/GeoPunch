import { db } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import { handlePrismaError } from "../_utils/handlePrismaError";
import { withAdminAuth } from "../_utils/auth";

async function listUsers(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const search = searchParams.get("search") || "";

  const data = await db.employees.findMany({
    skip: page * 10,
    take: 10,
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
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { id_card_no: { contains: search, mode: "insensitive" } },
        { phone_no: { contains: search, mode: "insensitive" } },
      ]
    },
  });

  const count = await db.employees.count({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { id_card_no: { contains: search, mode: "insensitive" } },
        { phone_no: { contains: search, mode: "insensitive" } },
      ]
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

  return Response.json({ users, count });
}

async function createUser(request: Request): Promise<Response> {
  let data: any;
  try {
    data = await request.json();
  } catch {
    return Response.json({ message: "Invalid request body" }, { status: 400 });
  }
  if (
    typeof data.name !== "string" || !data.name.trim() ||
    typeof data.id_card_no !== "string" || !data.id_card_no.trim() ||
    typeof data.password !== "string" || data.password.length < 8 ||
    typeof data.isActive !== "boolean" || typeof data.isAdmin !== "boolean"
  ) {
    return Response.json({ message: "Invalid employee details or password (minimum 8 characters)" }, { status: 400 });
  }

  try {
    const res = await db.employees.create({
      data: {
        id_card_no: data.id_card_no,
        name: data.name,
        ...(data.department_id ? { departments: { connect: { id: data.department_id } } } : {}),
        ...(data.company_id ? { company: { connect: { id: data.company_id } } } : {}),
        ...(data.designation_id ? { designations: { connect: { id: data.designation_id } } } : {}),
        phone_no: data.phone_no,
        is_active: data.isActive,
        email: data.email,
        password: null,
        hashed_password: await bcrypt.hash(data.password, 12),
        is_admin: data.isAdmin,
      },
      select: { id: true, name: true, id_card_no: true, email: true, is_admin: true, is_active: true },
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

export const GET = withAdminAuth(listUsers);
export const POST = withAdminAuth(createUser);
