import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireAuth, requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { updateEventSchema } from "@/lib/contracts/event";
import { eventDayLabel } from "@/lib/events";
import { notifyUsers, teamPlayerUserIds } from "@/lib/notify";
import { sendPushToUsers } from "@/lib/push";
import { prisma } from "@/lib/prisma";

const include = {
  team: { select: { id: true, name: true } },
  venue: { select: { id: true, name: true, address: true, mapLat: true, mapLng: true } },
  recurrence: true,
} as const;

/** A caller may touch this event if it's a club-wide event they can read, or
 *  it belongs to a team they have the right on. */
function assertCanRead(session: import("next-auth").Session, ev: { teamId: number | null }) {
  const a = authorize(session);
  const okRead =
    ev.teamId == null ? a.can("read", "Event", { teamId: null }) : a.can("read", "Event", { teamId: ev.teamId });
  if (!okRead) throw new ForbiddenError("You don't have access to this event.");
}

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const event = await prisma.event.findUnique({ where: { id: Number(params.id) }, include });
  if (!event) throw new NotFoundError("That event wasn't found.");
  assertCanRead(session, event);
  return ok(event);
});

export const PATCH = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const existing = await prisma.event.findUnique({ where: { id: Number(params.id) } });
  if (!existing) throw new NotFoundError("That event wasn't found.");

  const a = authorize(session);
  const canEdit =
    existing.teamId == null
      ? session.user.role === "ADMIN"
      : a.can("update", "Event", { teamId: existing.teamId });
  if (!canEdit) throw new ForbiddenError("You don't have access to this event.");

  const body = updateEventSchema.parse(await req.json());

  const updated = await prisma.event.update({
    where: { id: existing.id },
    data: {
      title: body.title,
      description: body.description,
      type: body.type,
      teamId: body.teamId === undefined ? undefined : body.teamId,
      venueId: body.venueId === undefined ? undefined : body.venueId,
      locationText: body.locationText,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
      arrivalTime: body.arrivalTime === undefined ? undefined : body.arrivalTime ? new Date(body.arrivalTime) : null,
      rsvpDeadline:
        body.rsvpDeadline === undefined ? undefined : body.rsvpDeadline ? new Date(body.rsvpDeadline) : null,
      capacity: body.capacity === undefined ? undefined : body.capacity,
      dressCode: body.dressCode,
      visibility: body.visibility,
      status: body.status,
    },
    include,
  });

  if (updated.teamId != null) {
    const cancelled = body.status === "CANCELLED";
    const recipients = await prisma.$transaction(async (tx) => {
      const users = await teamPlayerUserIds(tx, updated.teamId!);
      await notifyUsers(tx, users, {
        type: "TRAINING_CHANGE",
        title: cancelled ? "Event cancelled" : "Event updated",
        message: cancelled
          ? `${updated.title} was cancelled.`
          : `${updated.title} — ${eventDayLabel(updated.startAt)}`,
        linkPath: "/player/training",
      });
      return users;
    });
    await sendPushToUsers(recipients, {
      title: cancelled ? "Event cancelled" : "Event updated",
      body: updated.title,
      url: "/player/training",
    });
  }

  return ok(updated);
});

/** "Delete" = cancel; attendance/history stays intact (brief §14). */
export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const existing = await prisma.event.findUnique({ where: { id: Number(params.id) } });
  if (!existing) throw new NotFoundError("That event wasn't found.");

  const canEdit =
    existing.teamId == null
      ? session.user.role === "ADMIN"
      : authorize(session).can("delete", "Event", { teamId: existing.teamId });
  if (!canEdit) throw new ForbiddenError("You don't have access to this event.");

  const updated = await prisma.event.update({ where: { id: existing.id }, data: { status: "CANCELLED" } });

  if (updated.teamId != null) {
    const recipients = await prisma.$transaction(async (tx) => {
      const users = await teamPlayerUserIds(tx, updated.teamId!);
      await notifyUsers(tx, users, {
        type: "TRAINING_CHANGE",
        title: "Event cancelled",
        message: `${updated.title} was cancelled.`,
        linkPath: "/player/training",
      });
      return users;
    });
    await sendPushToUsers(recipients, { title: "Event cancelled", body: updated.title, url: "/player/training" });
  }

  return ok(updated);
});
