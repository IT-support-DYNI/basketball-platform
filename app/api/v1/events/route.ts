import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created } from "@/lib/api";
import { ForbiddenError } from "@/lib/api/errors";
import { requireAuth, requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { createEventSchema } from "@/lib/contracts/event";
import { parseRange, visibleEventScope } from "@/lib/events";
import { notifyUsers, teamPlayerUserIds } from "@/lib/notify";
import { sendPushToUsers } from "@/lib/push";
import { eventDayLabel } from "@/lib/events";
import { prisma } from "@/lib/prisma";

const listInclude = {
  team: { select: { id: true, name: true } },
  venue: { select: { id: true, name: true, address: true } },
} as const;

/**
 * GET /api/v1/events?from=&to=&teamId=&type=  — the calendar feed.
 * Scoped to what the caller can see (own teams + club-wide; admins see all).
 */
export const GET = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const sp = req.nextUrl.searchParams;
  const { gte, lte } = parseRange(sp);

  const teamId = sp.get("teamId");
  const type = sp.get("type");

  const events = await prisma.event.findMany({
    where: {
      AND: [
        visibleEventScope(session),
        { startAt: { gte, lte } },
        teamId ? { teamId: Number(teamId) } : {},
        type ? { type: type as never } : {},
      ],
    },
    orderBy: { startAt: "asc" },
    include: listInclude,
  });

  return ok(events);
});

/**
 * POST /api/v1/events — create an event. Coaches create team events; admins can
 * also create club-wide events (teamId: null). Recurrence lands in W5 part 2.
 */
export const POST = route(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const body = createEventSchema.parse(await req.json());

  if (body.teamId == null && session.user.role !== "ADMIN") {
    throw new ForbiddenError("Only an administrator can create a club-wide event.");
  }
  if (body.teamId != null && authorize(session).cannot("create", "Event", { teamId: body.teamId })) {
    throw new ForbiddenError("You don't have access to that team.");
  }

  const event = await prisma.event.create({
    data: {
      teamId: body.teamId ?? null,
      type: body.type,
      title: body.title,
      description: body.description,
      venueId: body.venueId ?? null,
      locationText: body.locationText,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      arrivalTime: body.arrivalTime ? new Date(body.arrivalTime) : null,
      rsvpDeadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
      capacity: body.capacity ?? null,
      dressCode: body.dressCode,
      visibility: body.visibility,
      createdByUserId: Number(session.user.id),
    },
    include: listInclude,
  });

  if (event.teamId != null) {
    const recipients = await prisma.$transaction(async (tx) => {
      const users = await teamPlayerUserIds(tx, event.teamId!);
      await notifyUsers(tx, users, {
        type: "TRAINING_CHANGE",
        title: `New ${event.type === "TRAINING" ? "training session" : "event"} scheduled`,
        message: `${event.title} — ${eventDayLabel(event.startAt)}`,
        linkPath: "/player/training",
      });
      return users;
    });
    await sendPushToUsers(recipients, {
      title: "New event scheduled",
      body: `${event.title} — ${eventDayLabel(event.startAt)}`,
      url: "/player/training",
    });
  }

  return created(event);
});
