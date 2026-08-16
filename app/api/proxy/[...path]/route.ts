import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

/**
 * Server-side proxy to the Render backend.
 *
 * The backend requires a shared X-API-Key. Injecting it here keeps it in the
 * Vercel runtime, out of the client bundle. Browser -> Vercel is same-origin,
 * and Vercel -> Render is server-to-server, so CORS never enters the picture.
 *
 * Requires a valid session: middleware.ts does not cover /api/proxy/*, so
 * without this check the route would be an open relay to the backend.
 */

const BACKEND_URL = process.env.BACKEND_URL;
const API_KEY = process.env.API_KEY;

// The backend exposes read-only endpoints; anything else is rejected outright.
const ALLOWED_PREFIXES = [
  "stations",
  "weather",
  "recommendations",
  "forecast",
  "dashboard",
  "map",
  "export",
  "treatments",
  "risks",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!BACKEND_URL || !API_KEY) {
    console.error("BACKEND_URL and API_KEY must be set for the proxy to work.");
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }

  const { path } = await params;

  // Reject traversal and empty segments before building the upstream URL.
  if (!path?.length || path.some((s) => !s || s === "." || s === "..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const [prefix] = path;
  if (prefix === undefined || !ALLOWED_PREFIXES.includes(prefix)) {
    return NextResponse.json({ error: "Unknown endpoint" }, { status: 404 });
  }

  const search = req.nextUrl.search;
  const target = `${BACKEND_URL.replace(/\/$/, "")}/api/${path
    .map(encodeURIComponent)
    .join("/")}${search}`;

  try {
    const upstream = await fetch(target, {
      headers: { "X-API-Key": API_KEY, Accept: "application/json" },
      cache: "no-store",
      // Render free instances cold-start in ~50s; fail before Vercel's own
      // function timeout so the client gets a usable error instead of a hang.
      signal: AbortSignal.timeout(25_000),
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
        // The proxy is same-origin with the app, so stop the browser from
        // sniffing an upstream response into an executable content type.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    console.error(`Proxy request to ${path.join("/")} failed:`, err);
    return NextResponse.json(
      {
        error: timedOut
          ? "Backend timed out (free-tier instance may be waking up)"
          : "Backend unreachable",
      },
      { status: 504 }
    );
  }
}
