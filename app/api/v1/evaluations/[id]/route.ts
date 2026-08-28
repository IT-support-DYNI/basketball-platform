import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth, requireRole, requirePlayerAccess } from "@/lib/authorization";
import { updateEvaluationSchema } from "@/lib/contracts/performance";
import { computeOverallScore } from "@/lib/performance";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));

  const evaluation = await prisma.performanceEvaluation.findUnique({
    where: { id: Number(params.id) },
    include: { categoryScores: true, player: true, coach: { include: { user: { select: { name: true } } } } },
  });
  if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  requirePlayerAccess(session, evaluation.player);
  return NextResponse.json(evaluation);
});

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const evaluationId = Number(params.id);

  const existing = await prisma.performanceEvaluation.findUnique({
    where: { id: evaluationId },
    include: { player: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  requirePlayerAccess(session, existing.player);

  const body = updateEvaluationSchema.parse(await req.json());

  const updated = await prisma.$transaction(async (tx) => {
    if (body.categoryScores) {
      await tx.performanceCategoryScore.deleteMany({ where: { evaluationId } });
    }

    return tx.performanceEvaluation.update({
      where: { id: evaluationId },
      data: {
        periodStart: body.periodStart ? new Date(body.periodStart) : undefined,
        periodEnd: body.periodEnd ? new Date(body.periodEnd) : undefined,
        strengths: body.strengths,
        developmentAreas: body.developmentAreas,
        overallScore: body.categoryScores
          ? computeOverallScore(body.categoryScores.map((c) => c.score))
          : undefined,
        categoryScores: body.categoryScores ? { create: body.categoryScores } : undefined,
      },
      include: { categoryScores: true },
    });
  });

  return NextResponse.json(updated);
});
