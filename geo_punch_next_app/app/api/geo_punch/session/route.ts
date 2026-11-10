import { requireUser } from "../../_utils/auth";

export async function GET(request: Request) {
  const { response } = await requireUser(request);
  return response ?? Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
