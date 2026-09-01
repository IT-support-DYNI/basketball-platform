import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, noContent } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { markConversationRead } from "@/lib/chat";

/** POST — mark the conversation read up to now. */
export const POST = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  await markConversationRead(Number(params.id), Number(session.user.id));
  return noContent();
});
