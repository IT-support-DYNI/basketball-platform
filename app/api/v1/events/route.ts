import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created } from "@/lib/api";
import { ForbiddenError } from "@/lib/api/errors";
import { requireAuth, requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { createEventSchema } from "@/lib/contracts/event";
import { parseRange, visibleEventScope } from "@/lib/events";
import { expandOccurrences } from "@/lib/recurrence";
import { notifyUsers, teamPlayerUserIds } from "@/lib/notify";
import { sendPushToUsers } from "@/lib/push";
import { eventDayLabel } from "@/lib/events";
import { prisma } from "@/lib/prisma";

const listInclude = {
  team: { select: { id: true, name: true } },
  venue: { select: { id: true, name: true, address: true } },
  trainingPlan: { select: { id: true, title: true, status: true } },
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
 * also create club-wide events (teamId: null). A `recurrence` rule materialises
 * one Event row per occurrence, all sharing a recurrenceId.
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

  const firstStart = new Date(body.startAt);
  const firstEnd = new Date(body.endAt);
  const baseData = {
    teamId: body.teamId ?? null,
    type: body.type,
    title: body.title,
    description: body.description,
    venueId: body.venueId ?? null,
    locationText: body.locationText,
    arrivalTime: body.arrivalTime ? new Date(body.arrivalTime) : null,
    rsvpDeadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
    capacity: body.capacity ?? null,
    dressCode: body.dressCode,
    visibility: body.visibility,
    createdByUserId: Number(session.user.id),
  };

  const event = body.recurrence
    ? await prisma.$transaction(async (tx) => {
        const rec = await tx.eventRecurrence.create({
          data: {
            frequency: body.recurrence!.frequency,
            interval: body.recurrence!.interval,
            byWeekday: body.recurrence!.byWeekday,
            until: body.recurrence!.until ? new Date(body.recurrence!.until) : null,
            count: body.recurrence!.count ?? null,
          },
        });
        const occ = expandOccurrences(
          {
            frequency: rec.frequency,
            interval: rec.interval,
            byWeekday: rec.byWeekday,
            until: rec.until,
            count: rec.count,
          },
          firstStart,
          firstEnd,
        );
        await tx.event.createMany({
          data: occ.map((o) => ({ ...baseData, startAt: o.startAt, endAt: o.endAt, recurrenceId: rec.id })),
        });
        const first = await tx.event.findFirst({
          where: { recurrenceId: rec.id },
          orderBy: { startAt: "asc" },
          include: listInclude,
        });
        return first!;
      })
    : await prisma.event.create({
        data: { ...baseData, startAt: firstStart, endAt: firstEnd },
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
    }, "SCHEDULE");
  }

  return created(event);
});
