import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/api/_utils/jwt";

const publicPaths = new Set([
  "/login",
  "/api/auth/login",
  "/api/auth/geo_punch/login",
  "/api/auth/logout",
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Old upload URLs must never be served as static public files. Selfies are
  // delivered through the authenticated, record-aware API route instead.
  if (pathname === "/uploads" || pathname.startsWith("/uploads/")) {
    return new Response(null, { status: 404 });
  }

  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    publicPaths.has(pathname)
  ) {
    return NextResponse.next();
  }

  const bearer = req.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ")
    ? bearer.slice(7).trim()
    : req.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const adminOnly =
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/users") ||
    pathname.startsWith("/api/library/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/";

  if (adminOnly && payload.isAdmin !== true) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
