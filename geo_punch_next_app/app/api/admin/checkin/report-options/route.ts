import { db } from "@/utils/prisma";
import { withAdminAuth } from "../../../_utils/auth";

async function reportOptions(): Promise<Response> {
  const [companies, offices] = await Promise.all([
    db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.offices.findMany({
      select: { id: true, name: true, company_id: true, company: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);
  return Response.json({ companies, offices });
}

export const GET = withAdminAuth(reportOptions);
