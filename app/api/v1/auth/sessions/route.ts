import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { listAuthSessions } from "@/lib/auth-sessions";

/** GET /api/v1/auth/sessions — the caller's active device sessions, current one flagged. */
export const GET = route(async (_req, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const rows = await listAuthSessions(Number(session.user.id));

  return ok(
    rows.map((s) => ({
      id: s.id,
      current: s.tokenId === session.user.sid,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
    })),
    { requestId },
  );
});
