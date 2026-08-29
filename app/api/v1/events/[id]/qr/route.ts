import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { mintQrToken } from "@/lib/checkin";
import { baseUrl } from "@/lib/base-url";
import { prisma } from "@/lib/prisma";

/** GET /api/v1/events/{id}/qr — mint a fresh rotating check-in token for the
 *  venue screen. Coach only; the screen re-fetches every ~20s. */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const eventId = Number(params.id);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { teamId: true, venue: { select: { checkInPin: true } } },
  });
  if (!event) throw new NotFoundError("That event wasn't found.");
  if (event.teamId == null || authorize(session).cannot("record", "Attendance", { teamId: event.teamId })) {
    throw new ForbiddenError("You don't run this event.");
  }

  const { token, expiresAt } = await mintQrToken(eventId);
  return ok({
    token,
    expiresAt,
    checkinUrl: `${baseUrl()}/checkin/${eventId}?t=${token}`,
    venuePin: event.venue?.checkInPin ?? null,
  });
});
