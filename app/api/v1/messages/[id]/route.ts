import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, noContent } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { messageBodySchema } from "@/lib/contracts/chat";
import { editMessage, deleteMessage } from "@/lib/chat";

/** PATCH — edit your own message (15-minute window). */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = messageBodySchema.parse(await req.json());
  await editMessage(Number(params.id), Number(session.user.id), body.body);
  return ok({ edited: true });
});

/** DELETE — soft-delete (author, a conversation admin, or a club admin). */
export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  await deleteMessage(Number(params.id), Number(session.user.id), session.user.role);
  return noContent();
});
