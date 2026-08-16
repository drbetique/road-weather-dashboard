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

/**
 * Mock credentials for local development and testing only.
 *
 * These are placeholders with no connection to any real person or account.
 * Passwords are stored in plaintext and shipped in the repository, so this
 * store must be replaced with a real user database (with hashed passwords)
 * before this application handles anything sensitive.
 */
export const USERS: (User & { password: string })[] = [
  {
    id: "1",
    name: "Test Admin",
    email: "admin@example.com",
    role: "admin",
    password: "dev-admin-password",
  },
  {
    id: "2",
    name: "Test Operator",
    email: "operator@example.com",
    role: "operator",
    password: "dev-operator-password",
  },
  {
    id: "3",
    name: "Test Viewer",
    email: "viewer@example.com",
    role: "viewer",
    password: "dev-viewer-password",
  },
];

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
