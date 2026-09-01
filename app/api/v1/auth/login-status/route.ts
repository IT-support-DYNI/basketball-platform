import { NextRequest } from "next/server";

import { route, ok } from "@/lib/api";
import { getLockoutState } from "@/lib/login-throttle";

/**
 * GET /api/v1/auth/login-status?email= — lets the sign-in page tell the user
 * "too many attempts, try again in N minutes" instead of a generic error.
 * Reveals only lockout state, never whether the account exists.
 */
export const GET = route(async (req: NextRequest, { requestId }) => {
  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return ok({ locked: false, retryAfterMinutes: 0 }, { requestId });

  const state = await getLockoutState(email);
  return ok(state, { requestId });
});
