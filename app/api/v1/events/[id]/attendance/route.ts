import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireAuth, requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { bulkAttendanceSchema } from "@/lib/contracts/attendance";
import { prisma } from "@/lib/prisma";
import { rosterPlayerFilter } from "@/lib/roster";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const eventId = Number(params.id);

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { teamId: true } });
  if (!event) throw new NotFoundError("That event wasn't found.");
  if (event.teamId == null || authorize(session).cannot("read", "Attendance", { teamId: event.teamId })) {
    throw new ForbiddenError("You don't have access to this event's attendance.");
  }

  const records = await prisma.attendanceRecord.findMany({
    where: { eventId },
    include: { player: { include: { user: { select: { name: true } } } } },
  });
  return ok(records);
});

/** Bulk upsert per-player status for one event — coach only. */
export const PUT = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const eventId = Number(params.id);

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { teamId: true } });
  if (!event) throw new NotFoundError("That event wasn't found.");
  if (event.teamId == null || authorize(session).cannot("record", "Attendance", { teamId: event.teamId })) {
    throw new ForbiddenError("You don't have access to this event's attendance.");
  }

  const body = bulkAttendanceSchema.parse(await req.json());
  const coachProfileId = session.user.coachProfileId!;

  // Only players on this event's team can be marked — otherwise a coach could
  // write attendance history onto any player in the club.
  const rostered = await prisma.playerProfile.findMany({
    where: { AND: [rosterPlayerFilter(event.teamId), { id: { in: body.records.map((r) => r.playerId) } }] },
    select: { id: true },
  });
  const allowed = new Set(rostered.map((p) => p.id));
  if (body.records.some((r) => !allowed.has(r.playerId))) {
    throw new ForbiddenError("One or more of those players isn't on this team.");
  }

  const results = await prisma.$transaction(
    body.records.map((record) =>
      prisma.attendanceRecord.upsert({
        where: { eventId_playerId: { eventId, playerId: record.playerId } },
        create: {
          eventId,
          playerId: record.playerId,
          status: record.status,
          note: record.note,
          recordedByCoachId: coachProfileId,
        },
        update: {
          status: record.status,
          note: record.note,
          recordedByCoachId: coachProfileId,
          recordedAt: new Date(),
        },
      }),
    ),
  );

  return ok(results);
});
