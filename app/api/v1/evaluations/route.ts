import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireRole, requirePlayerAccess } from "@/lib/authorization";
import { playerTeamIdsSelect, playerTeamIds } from "@/lib/roster";
import { createEvaluationSchema } from "@/lib/contracts/performance";
import { computeOverallScore } from "@/lib/performance";
import { prisma } from "@/lib/prisma";

/** Coach only, per the PRD permission matrix ("Enter performance evaluations"). */
export const POST = route(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const body = createEvaluationSchema.parse(await req.json());

  const player = await prisma.playerProfile.findUnique({ where: { id: body.playerId }, select: { id: true, userId: true, ...playerTeamIdsSelect } });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  requirePlayerAccess(session, { id: player.id, teamIds: playerTeamIds(player) });

  const overallScore = computeOverallScore(body.categoryScores.map((c) => c.score));

  // Evaluations are a staff-only record: the player isn't notified and has no
  // view of them (performance was removed from the player side), so there is
  // no notification or push here any more.
  const evaluation = await prisma.performanceEvaluation.create({
    data: {
      playerId: body.playerId,
      coachId: session.user.coachProfileId!,
      periodType: body.periodType,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      overallScore,
      strengths: body.periodType === "MONTHLY" ? body.strengths : undefined,
      developmentAreas: body.periodType === "MONTHLY" ? body.developmentAreas : undefined,
      categoryScores: { create: body.categoryScores },
    },
    include: { categoryScores: true },
  });

  return NextResponse.json(evaluation, { status: 201 });
});
