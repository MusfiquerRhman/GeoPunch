import { db } from "@/utils/prisma";
import { signToken } from "../../../_utils/jwt";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  let body: { id_card_no?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { id_card_no, password } = body;
  if (typeof id_card_no !== "string" || typeof password !== "string" || !id_card_no || !password) {
    return NextResponse.json({ error: "ID card number and password are required" }, { status: 400 });
  }


  // TODO: validate user from DB
  const user = await db.employees.findUnique({
    where: { id_card_no },
    select: {
      id: true,
      name: true,
      email: true,
      phone_no: true,
      is_active: true,
      is_admin: true,
      id_card_no: true,
      password: true,
      hashed_password: true,
      departments: {
        select: {
          id: true,
          department_name: true,
        },
      },
      designations: {
        select: {
          id: true,
          designations: true,
        },
      }
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid ID Card No or password" }, { status: 401 });
  }

  const passwordValid = user.hashed_password
    ? await bcrypt.compare(password, user.hashed_password)
    : user.password === password;

  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid ID Card No or password" }, { status: 401 });
  }

  if(!user.is_active){
    return NextResponse.json({ error: "Account is inactive. Please contact admin." }, { status: 403 });
  }

  // Upgrade a legacy plaintext password on its next successful login.
  if (!user.hashed_password && user.password) {
    await db.employees.update({
      where: { id: user.id },
      data: { hashed_password: await bcrypt.hash(password, 12), password: null },
    });
  }

  const token = await signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.is_admin === true,
    id_card_no: user.id_card_no,
    phone_no: user.phone_no,
    departments: user.departments?.department_name,
    designations: user.designations?.designations,
  });

  const response = NextResponse.json({ token, user: {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.is_admin === true,
    id_card_no: user.id_card_no,
    phone_no: user.phone_no,
    departments: user.departments?.department_name,
    designations: user.designations?.designations,
  }});

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // important!
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  return response;
}
