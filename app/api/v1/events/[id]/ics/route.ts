import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { buildCalendar } from "@/lib/ics";
import { prisma } from "@/lib/prisma";

/** Download a single event as an .ics file. */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const event = await prisma.event.findUnique({
    where: { id: Number(params.id) },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      startAt: true,
      endAt: true,
      status: true,
      teamId: true,
      locationText: true,
      updatedAt: true,
      venue: { select: { name: true, address: true } },
    },
  });
  if (!event) throw new NotFoundError("That event wasn't found.");

  const canRead =
    event.teamId == null
      ? authorize(session).can("read", "Event", { teamId: null })
      : authorize(session).can("read", "Event", { teamId: event.teamId });
  if (!canRead) throw new ForbiddenError("You don't have access to this event.");

  const body = buildCalendar([event], event.title);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${event.id}.ics"`,
    },
  });
});
