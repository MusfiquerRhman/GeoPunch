import { verifyToken } from "./jwt";

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];

  return await verifyToken(token);
}