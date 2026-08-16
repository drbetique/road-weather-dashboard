import bcrypt from "bcryptjs";
import { User } from "@/types";

/**
 * ============================================================================
 * MOCK USER STORE - TEST FIXTURES ONLY
 * ============================================================================
 *
 * SECURITY EXEMPTION / SCANNER NOTE:
 * The bcrypt hashes below are FAKE credentials for local development and
 * demos. They correspond to placeholder passwords that are published openly
 * on the login screen as one-click demo shortcuts. They authenticate no real
 * person, protect no real data, and grant access to nothing beyond this
 * demo's read-only weather views.
 *
 * Any secret-scanning finding against this file is a false positive.
 *
 * This is still NOT a production authentication system. It is a hardcoded
 * array with no account lifecycle, no password rotation, no lockout, and no
 * per-user salt management beyond what bcrypt provides. Replace it with a
 * real user database before this application handles anything sensitive.
 *
 * This module is deliberately separate from lib/auth.ts: middleware.ts runs
 * on the Edge runtime and imports lib/auth.ts, and bcryptjs has no business
 * in that bundle. Only the Node-runtime login route imports this file.
 * ============================================================================
 */

// gitleaks:allow  detect-secrets:allow  trufflehog:ignore
const MOCK_USERS: (User & { passwordHash: string })[] = [
  {
    id: "1",
    name: "Test Admin",
    email: "admin@example.com",
    role: "admin",
    // "dev-admin-password"
    passwordHash:
      "$2b$10$ODN9OhUtLSbjDPnkk4Q.2On3clL9KCtzbyu/tVOno.AKLXj6yZn/.",
  },
  {
    id: "2",
    name: "Test Operator",
    email: "operator@example.com",
    role: "operator",
    // "dev-operator-password"
    passwordHash:
      "$2b$10$V7WSS2iQzO6FcIZGIuUI1eo1wpe2Cg5dwx87ioPDQlvn02zZTgLea",
  },
  {
    id: "3",
    name: "Test Viewer",
    email: "viewer@example.com",
    role: "viewer",
    // "dev-viewer-password"
    passwordHash:
      "$2b$10$qI1dgyXflU/CKjPn6GtYYOfGhRg8Xnh13I0oY3T5RO/Ggas4Mga6i",
  },
];

/**
 * Verifies a login attempt, returning the user on success and null otherwise.
 *
 * Runs a bcrypt comparison even when the email is unknown, so that a missing
 * account and a wrong password take the same amount of time and the response
 * does not reveal which emails exist.
 */
export async function verifyCredentials(
  email: unknown,
  password: unknown
): Promise<User | null> {
  if (typeof email !== "string" || typeof password !== "string") return null;

  const record = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  // Dummy hash burns the same work factor when no account matches.
  const hash = record?.passwordHash ?? MOCK_USERS[0].passwordHash;
  const ok = await bcrypt.compare(password, hash);

  if (!record || !ok) return null;

  const { passwordHash: _unused, ...user } = record;
  void _unused;
  return user;
}
