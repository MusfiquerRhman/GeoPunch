import { SignJWT, jwtVerify, type JWTPayload } from "jose";

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
};

export async function signToken(payload: AppTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
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
    return payload as AppTokenPayload;
  } catch {
    return null;
  }
}
