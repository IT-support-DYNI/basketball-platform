import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, requirePlayerAccess } from "@/lib/authorization";
import { computeAttendanceStats } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";

export const GET = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = Number(params.id);

  const player = await prisma.playerProfile.findUnique({ where: { id: playerId } });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requirePlayerAccess(session, player);

  const records = await prisma.attendanceRecord.findMany({
    where: { playerId },
    include: { session: { select: { id: true, title: true, date: true } } },
    orderBy: { session: { date: "desc" } },
  });

  return NextResponse.json({ stats: computeAttendanceStats(records), records });
});
