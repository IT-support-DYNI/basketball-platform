import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { updateDisplayPreferencesSchema } from "@/lib/contracts/display-preferences";
import { prisma } from "@/lib/prisma";

const SELECT = { highContrast: true, fontSizePreference: true } as const;

/** GET — the caller's saved display/accessibility preferences. */
export const GET = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: Number(session.user.id) }, select: SELECT });
  return ok(user);
});

/** PATCH — update one or both. Every signed-in user manages only their own. */
export const PATCH = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = updateDisplayPreferencesSchema.parse(await req.json());

  const user = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: body,
    select: SELECT,
  });
  return ok(user);
});
