import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/utils/prisma";
import { verifyToken } from "./jwt";

export type AuthenticatedEmployee = {
  id: string;
  is_admin: boolean;
  company_id: string | null;
};

function tokenFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7).trim();

  const cookie = req.headers.get("cookie") ?? "";
  const tokenCookie = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  if (!tokenCookie) return null;
  try {
    return decodeURIComponent(tokenCookie.slice("token=".length));
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: Request): Promise<AuthenticatedEmployee | null> {
  const token = tokenFromRequest(req);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const employee = await db.employees.findUnique({
    where: { id: payload.id },
    select: { id: true, is_active: true, is_admin: true, company_id: true },
  });

  if (!employee?.is_active) return null;
  return {
    id: employee.id,
    is_admin: employee.is_admin === true,
    company_id: employee.company_id,
  };
}

export async function requireUser(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, response: null };
}

export async function requireAdmin(req: Request) {
  const result = await requireUser(req);
  if (!result.user) return result;
  if (!result.user.is_admin) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}

export async function migrateLegacyEmployeePasswords() {
  const employees = await db.employees.findMany({
    where: { password: { not: null } },
    select: { id: true, password: true, hashed_password: true },
  });

  for (let start = 0; start < employees.length; start += 5) {
    await Promise.all(employees.slice(start, start + 5).map(async (employee) => {
      const legacyPassword = employee.password;
      if (legacyPassword === null) return;
      const hashedPassword = employee.hashed_password ?? await bcrypt.hash(legacyPassword, 12);
      await db.employees.updateMany({
        where: { id: employee.id, password: legacyPassword },
        data: { hashed_password: hashedPassword, password: null },
      });
    }));
  }
}

type RouteHandler = (...args: any[]) => Promise<Response>;

export function withAdminAuth<T extends RouteHandler>(handler: T): T {
  const wrapped = async (...args: Parameters<T>) => {
    const result = await requireAdmin(args[0] as Request);
    if (result.response) return result.response;
    return handler(...args);
  };
  return wrapped as T;
}
