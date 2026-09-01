import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, NotFoundError } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/** POST — the caller acknowledges having read the announcement. Idempotent. */
export const POST = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const announcementId = Number(params.id);

  const exists = await prisma.announcement.findUnique({ where: { id: announcementId }, select: { id: true } });
  if (!exists) throw new NotFoundError("That announcement wasn't found.");

  await prisma.announcementAck.upsert({
    where: { announcementId_userId: { announcementId, userId: Number(session.user.id) } },
    create: { announcementId, userId: Number(session.user.id) },
    update: {},
  });
  return ok({ acknowledged: true });
});
