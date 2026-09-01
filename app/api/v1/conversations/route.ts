import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { createConversationSchema } from "@/lib/contracts/chat";
import { conversationsFor, createConversation, ensureTeamConversation } from "@/lib/chat";

/** GET — the caller's conversations. Ensures their team channel(s) exist first. */
export const GET = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));
  const userId = Number(session.user.id);

  const teamIds =
    session.user.role === "COACH"
      ? (session.user.teamIds ?? [])
      : session.user.role === "PLAYER" && session.user.teamId != null
        ? [session.user.teamId]
        : [];
  for (const teamId of teamIds) await ensureTeamConversation(teamId);

  return ok(await conversationsFor(userId));
});

/** POST — start a group or direct conversation (safeguarding rules enforced). */
export const POST = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = createConversationSchema.parse(await req.json());
  const id = await createConversation(Number(session.user.id), body);
  return created({ id });
});
