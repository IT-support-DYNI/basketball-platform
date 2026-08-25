import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireRole, requirePlayerAccess } from "@/lib/authorization";
import { createEvaluationSchema } from "@/lib/validation/performance";
import { computeOverallScore } from "@/lib/performance";
import { notifyUser } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

/** Coach only, per the PRD permission matrix ("Enter performance evaluations"). */
export const POST = withApi(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const body = createEvaluationSchema.parse(await req.json());

  const player = await prisma.playerProfile.findUnique({ where: { id: body.playerId } });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  requirePlayerAccess(session, player);

  const overallScore = computeOverallScore(body.categoryScores.map((c) => c.score));

  const evaluation = await prisma.$transaction(async (tx) => {
    const created = await tx.performanceEvaluation.create({
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

    await notifyUser(tx, {
      userId: player.userId,
      type: "NEW_EVALUATION",
      title: `New ${body.periodType.toLowerCase()} performance evaluation`,
      message: `Your coach recorded a new evaluation — overall score ${overallScore}/10.`,
      linkPath: "/player/performance",
    });

    return created;
  });

  return NextResponse.json(evaluation, { status: 201 });
});
