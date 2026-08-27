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
    pathname === "/register" ||
    pathname === "/set-password" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/public");

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (isPublic) {
    return NextResponse.next();
  }

  if (!token || token.isActive === false) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Both gates below redirect PAGE navigation only. Redirecting an API
  // call would send it into a page render instead of the route handler —
  // API routes enforce their own auth via lib/authorization.ts regardless,
  // per this file's own opening comment. (Found via a real bug: the
  // registration-status gate below was silently breaking a pending
  // player's own AJAX calls, since a plain pathname check redirected them
  // too — see git history for the fix.)
  const isApiRequest = pathname.startsWith("/api/");

  if (!isApiRequest && token.mustChangePassword && pathname !== "/set-password") {
    return NextResponse.redirect(new URL("/set-password", req.url));
  }

  // DYNI Blazers PRD §6 (Journey A) — a self-registered player is gated to
  // a status page until an admin approves them, instead of the normal
  // dashboard/nav. Only PLAYER carries registrationStatus; Admin/Coach/
  // Guardian are unaffected (undefined skips this check entirely).
  if (
    !isApiRequest &&
    token.role === "PLAYER" &&
    token.registrationStatus &&
    token.registrationStatus !== "APPROVED" &&
    pathname !== "/registration-status"
  ) {
    return NextResponse.redirect(new URL("/registration-status", req.url));
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
