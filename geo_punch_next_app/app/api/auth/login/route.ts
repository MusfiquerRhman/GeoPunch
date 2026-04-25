// app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signToken } from "../../_utils/jwt";

// fake DB for example
const users = [
  { id: 1, email: "admin@test.com", password: "$2b$10$hashed..." },
];

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = users.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const token = signToken({ userId: user.id });

  const res = NextResponse.json({ success: true });

  // 🔥 store in HTTP-only cookie
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  return res;
}