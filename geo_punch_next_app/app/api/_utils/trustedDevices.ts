import { createHash } from "node:crypto";
import { db } from "@/utils/prisma";

export function getDeviceCredentialHash(request: Request): string | null {
  const credential = request.headers.get("X-GeoPunch-Device");
  return credential && /^[a-f0-9]{64}$/.test(credential)
    ? createHash("sha256").update(credential).digest("hex")
    : null;
}

function label(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) || null : null;
}

export function deviceDetails(value: unknown) {
  const details = typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : {};
  return {
    name: label(details.name, 120) ?? label(details.model, 120) ?? "Unnamed device",
    model: label(details.model, 120),
    platform: label(details.platform, 20),
    os_version: label(details.osVersion, 60),
  };
}

const deviceState = { id: true, status: true, version: true } as const;

export function recordDeviceSignIn(
  employeeId: string,
  credentialHash: string,
  details: ReturnType<typeof deviceDetails>,
  resend: boolean,
) {
  return db.$transaction(async (tx) => {
    // Only one installation can claim the first sign-in for an employee.
    const active = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM employees WHERE id = ${employeeId}::uuid AND is_active = true FOR NO KEY UPDATE
    `;
    if (!active.length) return null;

    await tx.$queryRaw`
      SELECT id FROM trusted_devices WHERE employee_id = ${employeeId}::uuid
        AND credential_hash = ${credentialHash} FOR UPDATE
    `;
    const existing = await tx.trusted_devices.findUnique({
      where: { employee_id_credential_hash: { employee_id: employeeId, credential_hash: credentialHash } },
      select: deviceState,
    });
    const now = new Date();
    if (!existing) {
      const prior = await tx.trusted_devices.findFirst({ where: { employee_id: employeeId }, select: { id: true } });
      return tx.trusted_devices.create({
        data: {
          employee_id: employeeId,
          credential_hash: credentialHash,
          ...details,
          status: prior ? "pending" : "trusted",
          reviewed_at: prior ? null : now,
          last_sign_in_at: prior ? null : now,
        },
        select: deviceState,
      });
    }

    if (existing.status === "rejected" && resend) {
      return tx.trusted_devices.update({
        where: { id: existing.id },
        data: {
          ...details,
          status: "pending",
          version: { increment: 1 },
          requested_at: now,
          reviewed_at: null,
          reviewed_by: null,
        },
        select: deviceState,
      });
    }

    if (existing.status === "trusted") {
      await tx.trusted_devices.update({
        where: { id: existing.id },
        data: { ...details, last_sign_in_at: now },
        select: { id: true },
      });
    }
    return existing;
  }, { isolationLevel: "ReadCommitted" });
}
