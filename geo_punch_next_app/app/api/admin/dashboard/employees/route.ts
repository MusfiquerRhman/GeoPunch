import { db } from "@/utils/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { withAdminAuth } from "../../../_utils/auth";
import { dashboardError, dashboardScope, DashboardFilterError } from "../scope";

async function getDashboardEmployees(request: Request): Promise<Response> {
  try {
    const params = new URL(request.url).searchParams;
    const view = params.get("view") ?? "active";
    const page = Number(params.get("page") ?? 0);
    if (!["active", "punched", "no-punch"].includes(view) || !Number.isSafeInteger(page) || page < 0 || page > 1000000) {
      throw new DashboardFilterError("Invalid employee list or page.");
    }
    const scope = await dashboardScope(request);
    const where: Prisma.employeesWhereInput = {
      ...scope.employeeWhere,
      ...(view === "active" ? {} : { attendance_record: {
        [view === "punched" ? "some" : "none"]: scope.dayWhere,
      } }),
    };
    const pageSize = 20;
    const [employees, total] = await db.$transaction(async (tx) => Promise.all([
      tx.employees.findMany({
        where, skip: page * pageSize, take: pageSize,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: { id: true, name: true, id_card_no: true, company: { select: { name: true } } },
      }),
      tx.employees.count({ where }),
    ]), { isolationLevel: "RepeatableRead" });
    return Response.json({ employees, total, page, pageSize }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return dashboardError(error);
  }
}

export const GET = withAdminAuth(getDashboardEmployees);
