"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIELD =
  "w-full border border-line bg-surface-3 px-3 py-2.5 text-[11px] text-ink-bright outline-none placeholder:text-ink-dim focus-visible:border-accent";
const FIELD_LABEL =
  "mb-1.5 text-[9px] uppercase tracking-[0.15em] text-ink-dim";

/**
 * Demo shortcuts. These are FAKE test accounts, published here on purpose so
 * reviewers can sign in; see lib/users.ts. They guard nothing real. Any
 * secret-scanner hit here is a false positive.
 */
/* gitleaks:allow  detect-secrets:allow */
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@example.com", pw: "dev-admin-password" },
  { label: "Operator", email: "operator@example.com", pw: "dev-operator-password" },
  { label: "Viewer", email: "viewer@example.com", pw: "dev-viewer-password" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <main className="w-full max-w-90 border border-line bg-surface-2 p-6 sm:p-8">
        <header className="mb-7">
          <p className="mb-1.5 text-[9px] uppercase tracking-[0.2em] text-accent">
            Road Weather System
          </p>
          <h1 className="text-lg font-extrabold tracking-[0.05em] text-ink-bright">
            COMMAND CENTER
          </h1>
          <p className="mt-1 text-[9px] tracking-[0.1em] text-ink-dim">
            AUTHORIZED ACCESS ONLY
          </p>
        </header>

        <div className="mb-3.5">
          <label className={FIELD_LABEL} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
            className={FIELD}
            placeholder="user@example.com"
          />
        </div>

        <div className="mb-5">
          <label className={FIELD_LABEL} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
            className={FIELD}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mb-3.5 border border-urgency-critical bg-urgency-critical-soft px-3 py-2 text-[10px] tracking-[0.08em] text-urgency-critical"
          >
            ✗ {error.toUpperCase()}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleLogin()}
          disabled={loading}
          className="w-full cursor-pointer border border-accent bg-transparent px-3 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-soft"
        >
          {loading ? "AUTHENTICATING..." : "LOGIN →"}
        </button>

        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-1.5 text-[8px] tracking-[0.1em] text-ink-dim">
            DEMO ACCOUNTS
          </p>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.label}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.pw);
              }}
              className="block w-full cursor-pointer border-b border-line py-1 text-left text-[9px] tracking-[0.05em] text-ink-dim transition-colors hover:text-ink"
            >
              <span className="mr-2 text-accent">{account.label}</span>
              {account.email}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
