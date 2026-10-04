import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../_utils/auth";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, isAdmin: user.is_admin });
}
