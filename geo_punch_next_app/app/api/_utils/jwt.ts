import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { SESSION_DURATION_SECONDS } from "./session";

function getSecret() {
  const value = process.env.JWT_SECRET;
  const secret = value ? new TextEncoder().encode(value) : null;
  if (!secret || secret.byteLength < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 bytes");
  }
  return secret;
}

export type AppTokenPayload = JWTPayload & {
  id: string;
  isAdmin: boolean;
  deviceId?: string;
  deviceVersion?: number;
};

export async function signToken(payload: AppTokenPayload) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_DURATION_SECONDS)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<AppTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.id !== "string" || typeof payload.isAdmin !== "boolean") {
      return null;
    }
    if (payload.deviceId !== undefined || payload.deviceVersion !== undefined) {
      if (typeof payload.deviceId !== "string" || !payload.deviceId ||
          typeof payload.deviceVersion !== "number" || !Number.isSafeInteger(payload.deviceVersion) ||
          payload.deviceVersion < 1) return null;
    }
    return payload as AppTokenPayload;
  } catch {
    return null;
  }
}
