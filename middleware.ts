import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/*
 * Coarse-grained UX redirect only — NOT the security boundary.
 * Every route handler re-checks role/ownership itself via
 * lib/authorization.ts, because middleware here only sees the
 * JWT, not the resource being requested.
 */

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  COACH: "/coach/dashboard",
  PLAYER: "/player/dashboard",
};

const ROLE_PREFIX: Record<string, string> = {
  ADMIN: "/admin",
  COACH: "/coach",
  PLAYER: "/player",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/set-password" ||
    pathname.startsWith("/api/auth");

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (isPublic) {
    return NextResponse.next();
  }

  if (!token || token.isActive === false) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.mustChangePassword && pathname !== "/set-password") {
    return NextResponse.redirect(new URL("/set-password", req.url));
  }

  const role = token.role as string;
  const homePath = ROLE_HOME[role];
  const ownPrefix = ROLE_PREFIX[role];

  const isProtectedArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/coach") ||
    pathname.startsWith("/player");

  if (isProtectedArea && ownPrefix && !pathname.startsWith(ownPrefix)) {
    return NextResponse.redirect(new URL(homePath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // `_vercel` must stay excluded: Vercel Web Analytics / Speed Insights send
  // beacon requests to /_vercel/insights/* and /_vercel/speed-insights/* on
  // this same origin, and those aren't authenticated — routing them through
  // the auth redirect above would 307 the beacon instead of recording it.
  matcher: ["/((?!_next/static|_next/image|_vercel|icons|favicon.ico|sw.js).*)"],
};
