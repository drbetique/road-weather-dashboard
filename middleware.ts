import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  const { pathname } = req.nextUrl;

  // Allow login page and API auth route
  if (pathname === "/" || pathname.startsWith("/api/auth")) {
    if (token) {
      const user = await verifyToken(token);
      if (user && pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    return NextResponse.next();
  }

  // Protect dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
