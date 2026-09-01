import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth, requirePlayerAccess } from "@/lib/authorization";
import { playerTeamIdsSelect, playerTeamIds } from "@/lib/roster";
import { computeAttendanceStats } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = Number(params.id);

  const player = await prisma.playerProfile.findUnique({ where: { id: playerId }, select: { id: true, ...playerTeamIdsSelect } });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requirePlayerAccess(session, { id: player.id, teamIds: playerTeamIds(player) });

  const records = await prisma.attendanceRecord.findMany({
    where: { playerId },
    include: { event: { select: { id: true, title: true, startAt: true } } },
    orderBy: { event: { startAt: "desc" } },
  });

  return NextResponse.json({ stats: computeAttendanceStats(records), records });
});
