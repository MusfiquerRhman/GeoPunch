import { db } from "@/utils/prisma";
import { dashboardFilters } from "@/utils/adminDashboard";

export class DashboardFilterError extends Error {}

export async function dashboardScope(request: Request) {
  const params = new URL(request.url).searchParams;
  let scope;
  try {
    scope = dashboardFilters(params);
  } catch (error) {
    throw new DashboardFilterError(error instanceof Error ? error.message : "Invalid dashboard filters.");
  }
  const [company, office] = await Promise.all([
    scope.company ? db.company.findUnique({ where: { id: scope.company }, select: { id: true } }) : null,
    scope.office ? db.offices.findUnique({ where: { id: scope.office }, select: { id: true, company_id: true } }) : null,
  ]);
  if (scope.company && !company) throw new DashboardFilterError("The selected company no longer exists.");
  if (scope.office && !office) throw new DashboardFilterError("The selected office no longer exists.");
  if (office && scope.company && office.company_id !== scope.company) {
    throw new DashboardFilterError("Select an office belonging to the selected company.");
  }
  // Employees are assigned to companies, not offices. An office scopes its company roster.
  if (office?.company_id && !scope.company) {
    params.set("company", office.company_id);
    scope = dashboardFilters(params);
  }
  return {
    ...scope,
    employeeWhere: { is_active: true, ...(scope.company ? { company_id: scope.company } : {}) },
  };
}

export function dashboardError(error: unknown) {
  if (error instanceof DashboardFilterError) return Response.json({ error: error.message }, { status: 400 });
  console.error("Admin dashboard request failed:", error);
  return Response.json({ error: "Could not load dashboard data. Please try again." }, { status: 500 });
}
