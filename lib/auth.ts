import { SignJWT, jwtVerify } from "jose";
import { User, UserRole } from "@/types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-only-secret"
);

// Static user store - in production this would be a database
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
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
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
