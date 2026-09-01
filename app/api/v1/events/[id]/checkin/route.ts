import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { checkinSchema } from "@/lib/contracts/attendance";
import { statusFromCheckIn, verifyPin, verifyQrToken } from "@/lib/checkin";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/events/{id}/checkin — a player checks themselves in at the venue
 * with the rotating QR token or the venue PIN. Both are verified server-side.
 */
export const POST = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = session.user.playerId;
  if (!playerId) throw new ForbiddenError("Only players check in to events.");

  const event = await prisma.event.findUnique({
    where: { id: Number(params.id) },
    select: {
      id: true,
      teamId: true,
      status: true,
      startAt: true,
      endAt: true,
      arrivalTime: true,
      venue: { select: { checkInPin: true } },
    },
  });
  if (!event) throw new NotFoundError("That event wasn't found.");
  if (event.teamId == null || authorize(session).cannot("read", "Event", { teamId: event.teamId })) {
    throw new ForbiddenError("You're not on this event's team.");
  }
  if (event.status === "CANCELLED") throw new BadRequestError("This event was cancelled.");

  const now = new Date();
  const opensAt = new Date(event.startAt.getTime() - 2 * 3600e3);
  const closesAt = new Date(event.endAt.getTime() + 60 * 60e3);
  if (now < opensAt || now > closesAt) {
    throw new BadRequestError("Check-in isn't open for this event right now.");
  }

  const body = checkinSchema.parse(await req.json());
  let method: "QR" | "PIN";
  if (body.token && (await verifyQrToken(event.id, body.token))) {
    method = "QR";
  } else if (body.pin && verifyPin(event.venue?.checkInPin, body.pin)) {
    method = "PIN";
  } else {
    throw new ForbiddenError("That code has expired or is incorrect — ask your coach for the current one.");
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: { eventId_playerId: { eventId: event.id, playerId } },
    select: { id: true, checkInAt: true },
  });

  if (existing?.checkInAt) {
    return ok({ alreadyCheckedIn: true, checkInAt: existing.checkInAt });
  }

  const status = statusFromCheckIn(now, event.arrivalTime ?? event.startAt);
  const record = await prisma.attendanceRecord.upsert({
    where: { eventId_playerId: { eventId: event.id, playerId } },
    create: { eventId: event.id, playerId, status, method, checkInAt: now },
    update: { status, method, checkInAt: now },
    select: { id: true, status: true, checkInAt: true, checkOutAt: true },
  });

  return ok(record);
});
