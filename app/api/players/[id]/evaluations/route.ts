import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, requirePlayerAccess } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/** Full weekly + monthly history for a player, oldest-first — what the trend chart on the Performance History screen (PRD §5.5) plots. */
export const GET = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = Number(params.id);

  const player = await prisma.playerProfile.findUnique({ where: { id: playerId } });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requirePlayerAccess(session, player);

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
