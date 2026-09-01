import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { conversationView } from "@/lib/chat";

/** GET /api/v1/conversations/{id}?after=<messageId> — thread + participants. */
export const GET = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const after = req.nextUrl.searchParams.get("after");
  const view = await conversationView(
    Number(params.id),
    Number(session.user.id),
    after ? Number(after) : undefined,
  );
  return ok(view);
});
