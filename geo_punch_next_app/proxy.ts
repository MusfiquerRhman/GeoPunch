import { verifyToken } from "@/app/api/_utils/jwt";
import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  let token = req.cookies.get("token")?.value;
  
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||   // Next.js internals
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||  // if you use public/images
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/uploads") // allow access to uploaded images
  ) {
    return NextResponse.next();
  }

  if (!token) {
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return handleUnauthorized(req);
  }

  try {
    verifyToken(token);
    console.log("Token verified successfully for request to:", req.nextUrl.pathname);
    return NextResponse.next();
  } catch {
    return handleUnauthorized(req);
  }
}

function handleUnauthorized(req: NextRequest) {
  console.log("Unauthorized access attempt to:", req.nextUrl.pathname);
  if (req.nextUrl.pathname.startsWith("/api")) {
    return new Response(
      JSON.stringify({ message: "Unauthorized" }),
      { status: 401 }
    );
  }

  // return NextResponse.redirect(new URL("/login", req.url));
}