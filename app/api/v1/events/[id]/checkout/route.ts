import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { BadRequestError, ForbiddenError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/** POST /api/v1/events/{id}/checkout — the player records leaving. */
export const POST = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = session.user.playerId;
  if (!playerId) throw new ForbiddenError("Only players check out of events.");

  const record = await prisma.attendanceRecord.findUnique({
    where: { eventId_playerId: { eventId: Number(params.id), playerId } },
    select: { id: true, checkInAt: true },
  });
  if (!record?.checkInAt) throw new BadRequestError("You haven't checked in to this event.");

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { checkOutAt: new Date() },
    select: { id: true, status: true, checkInAt: true, checkOutAt: true },
  });
  return ok(updated);
});
