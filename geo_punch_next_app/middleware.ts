// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/_utils/jwt";

export function middleware(req: NextRequest) {
  let token = req.cookies.get("token")?.value;

  // check Authorization header if no cookie
  if (!token) {
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    if (req.nextUrl.pathname.startsWith("/api")) {
      return new Response(
        JSON.stringify({ message: "Unauthorized" }),
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// protect specific routes
export const config = {
    matcher: [
        "/library/:path*",
        "/attendance/:path*",
        "/admin/:path*",
        "/departments/:path*",
    ],
};