import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, noContent } from "@/lib/api";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { rsvpSchema } from "@/lib/contracts/event";
import { capacityState, rsvpWindowState, tallyResponses } from "@/lib/rsvp";
import { prisma } from "@/lib/prisma";

async function loadEvent(id: number) {
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      teamId: true,
      status: true,
      startAt: true,
      endAt: true,
      rsvpDeadline: true,
      capacity: true,
      title: true,
    },
  });
  if (!event) throw new NotFoundError("That event wasn't found.");
  return event;
}

function canRead(session: import("next-auth").Session, teamId: number | null) {
  return teamId == null
    ? authorize(session).can("read", "Event", { teamId: null })
    : authorize(session).can("read", "Event", { teamId });
}

/** GET — the caller's own RSVP + a summary. Staff who can record attendance for
 *  the event's team also get the per-person breakdown. */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const event = await loadEvent(Number(params.id));
  if (!canRead(session, event.teamId)) throw new ForbiddenError("You don't have access to this event.");

  const [mine, responses, rosterSize] = await Promise.all([
    prisma.availabilityResponse.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: Number(session.user.id) } },
      select: { response: true, note: true, updatedAt: true },
    }),
    prisma.availabilityResponse.findMany({
      where: { eventId: event.id },
      select: { response: true, note: true, user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    event.teamId != null
      ? prisma.teamMembership.count({
          where: { teamId: event.teamId, status: { notIn: ["FORMER", "INACTIVE"] } },
        })
      : 0,
  ]);

  const counts = tallyResponses(responses, rosterSize);
  const capacity = capacityState(event, counts.attending);
  const window = rsvpWindowState(event);

  const isStaff =
    event.teamId != null && authorize(session).can("record", "Attendance", { teamId: event.teamId });

  return ok({
    mine,
    counts,
    capacity,
    window,
    deadline: event.rsvpDeadline,
    roster: isStaff ? responses : undefined,
  });
});

/** POST — set or change the caller's RSVP. */
export const POST = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const event = await loadEvent(Number(params.id));
  if (!canRead(session, event.teamId)) throw new ForbiddenError("You don't have access to this event.");

  const body = rsvpSchema.parse(await req.json());
  const userId = Number(session.user.id);

  const existing = await prisma.availabilityResponse.findUnique({
    where: { eventId_userId: { eventId: event.id, userId } },
    select: { response: true },
  });

  const window = rsvpWindowState(event);
  // The window being closed blocks new commitments and changes, but not
  // repeating your existing answer (harmless).
  if (!window.open && existing?.response !== body.response) {
    throw new ConflictError(window.reason ?? "RSVPs are closed for this event.");
  }

  if (body.response === "ATTENDING" && existing?.response !== "ATTENDING" && event.capacity != null) {
    const attending = await prisma.availabilityResponse.count({
      where: { eventId: event.id, response: "ATTENDING" },
    });
    if (capacityState(event, attending).full) {
      throw new ConflictError("This event is full — mark yourself Unsure and your coach will follow up.");
    }
  }

  const saved = await prisma.availabilityResponse.upsert({
    where: { eventId_userId: { eventId: event.id, userId } },
    create: { eventId: event.id, userId, response: body.response, note: body.note },
    update: { response: body.response, note: body.note ?? null, respondedAt: new Date() },
    select: { response: true, note: true, updatedAt: true },
  });

  return ok(saved);
});

/** DELETE — clear the caller's RSVP ("actually, I haven't decided"). */
export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const event = await loadEvent(Number(params.id));
  if (!canRead(session, event.teamId)) throw new ForbiddenError("You don't have access to this event.");

  await prisma.availabilityResponse.deleteMany({
    where: { eventId: event.id, userId: Number(session.user.id) },
  });
  return noContent();
});
