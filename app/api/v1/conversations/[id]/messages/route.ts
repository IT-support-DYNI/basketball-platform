import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, created } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { messageBodySchema } from "@/lib/contracts/chat";
import { postMessage } from "@/lib/chat";

/** POST — send a message. */
export const POST = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = messageBodySchema.parse(await req.json());
  const result = await postMessage(Number(params.id), Number(session.user.id), body.body);
  return created(result);
});
