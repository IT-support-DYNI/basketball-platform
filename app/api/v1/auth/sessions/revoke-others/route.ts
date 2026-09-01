import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, BadRequestError } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { revokeOtherAuthSessions } from "@/lib/auth-sessions";

/** POST /api/v1/auth/sessions/revoke-others — sign out every device except this one. */
export const POST = route(async (_req, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  if (!session.user.sid) throw new BadRequestError("This session can't be identified.");

  const revoked = await revokeOtherAuthSessions(Number(session.user.id), session.user.sid);
  return ok({ revoked }, { requestId });
});
