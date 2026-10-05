import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireRole, requirePlayerAccess } from "@/lib/authorization";
import { playerTeamIdsSelect, playerTeamIds } from "@/lib/roster";
import { prisma } from "@/lib/prisma";

/** Full weekly + monthly history for a player, oldest-first — what the trend
 *  chart on the coach/admin Performance screen plots. Staff only: performance
 *  is not shown to players or guardians. */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const playerId = Number(params.id);

  const player = await prisma.playerProfile.findUnique({ where: { id: playerId }, select: { id: true, ...playerTeamIdsSelect } });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requirePlayerAccess(session, { id: player.id, teamIds: playerTeamIds(player) });

  const evaluations = await prisma.performanceEvaluation.findMany({
    where: { playerId },
    include: {
      categoryScores: true,
      coach: { include: { user: { select: { name: true } } } },
    },
    orderBy: { periodStart: "asc" },
  });

  return NextResponse.json(evaluations);
});
