import { z } from "zod";
import { db } from "@/utils/prisma";
import { requireAdmin } from "../../_utils/auth";

const decisionSchema = z.object({
  id: z.uuid(),
  version: z.number().int().positive(),
  decision: z.enum(["trust", "reject", "revoke"]),
});

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const headers = { "Cache-Control": "no-store" };
  if (new URL(request.url).searchParams.get("pending") === "1") {
    const pendingCount = await db.trusted_devices.count({ where: { status: "pending" } });
    return Response.json({ pendingCount }, { headers });
  }

  const devices = await db.trusted_devices.findMany({
    orderBy: [{ status: "asc" }, { requested_at: "desc" }],
    select: {
      id: true,
      name: true,
      model: true,
      platform: true,
      os_version: true,
      status: true,
      version: true,
      requested_at: true,
      last_sign_in_at: true,
      employee: { select: { name: true, id_card_no: true } },
    },
  });
  return Response.json({ devices }, { headers });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireAdmin(request);
  if (response) return response;

  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid device decision." }, { status: 400 });

  const { id, version, decision } = parsed.data;
  const result = await db.trusted_devices.updateMany({
    where: { id, version, status: decision === "revoke" ? "trusted" : "pending" },
    data: {
      status: decision === "trust" ? "trusted" : "rejected",
      reviewed_at: new Date(),
      reviewed_by: user.id,
      version: { increment: 1 },
    },
  });
  if (result.count !== 1) {
    return Response.json({ error: "This device request has changed. Review its current status and try again." }, { status: 409 });
  }
  return Response.json({ success: true });
}
