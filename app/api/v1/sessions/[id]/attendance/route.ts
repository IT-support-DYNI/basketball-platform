import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess } from "@/lib/authorization";
import { bulkAttendanceSchema } from "@/lib/contracts/attendance";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const sessionId = Number(params.id);

  const trainingSession = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
  if (!trainingSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireTeamAccess(session, trainingSession.teamId);

  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId },
    include: { player: { include: { user: { select: { name: true } } } } },
  });

  return NextResponse.json(records);
});

/** Bulk upsert per-player status for one session — Coach only, matches the PRD permission matrix. */
export const PUT = route<{ id: string }>(async (req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const sessionId = Number(params.id);

  const trainingSession = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
  if (!trainingSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requireTeamAccess(session, trainingSession.teamId);

  const body = bulkAttendanceSchema.parse(await req.json());
  const coachProfileId = session.user.coachProfileId!;

  const results = await prisma.$transaction(
    body.records.map((record) =>
      prisma.attendanceRecord.upsert({
        where: { sessionId_playerId: { sessionId, playerId: record.playerId } },
        create: {
          sessionId,
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
      })
    )
  );

  return NextResponse.json(results);
});
