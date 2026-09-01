import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { preferencesFor, setPreference } from "@/lib/notifications";
import { NOTIFICATION_CATEGORIES } from "@/lib/notification-categories";

const patchSchema = z.object({
  category: z.enum(NOTIFICATION_CATEGORIES as [string, ...string[]]),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
});

/** GET — the caller's channel preferences for every category. */
export const GET = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));
  return ok(await preferencesFor(Number(session.user.id)));
});

/** PATCH — set one category's channels. */
export const PATCH = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = patchSchema.parse(await req.json());
  await setPreference(Number(session.user.id), body.category as never, {
    email: body.email,
    push: body.push,
  });
  return ok(await preferencesFor(Number(session.user.id)));
});
