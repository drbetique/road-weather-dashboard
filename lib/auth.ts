import { SignJWT, jwtVerify } from "jose";
import { User, UserRole } from "@/types";

/**
 * JWT signing secret. Must be supplied via the JWT_SECRET environment
 * variable -- there is deliberately no fallback. The previous hardcoded
 * default was committed to the repository, which let anyone forge a valid
 * admin session token.
 */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Generate one with " +
        "`openssl rand -base64 48` and add it to the Vercel project."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(user: User): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export function canExportCSV(role: UserRole): boolean {
  return role === "admin" || role === "operator";
}

export function canViewSystemStats(role: UserRole): boolean {
  return role === "admin";
}

export function canTakeAction(role: UserRole): boolean {
  return role === "admin" || role === "operator";
}
