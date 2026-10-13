import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, BadRequestError, ForbiddenError, NotFoundError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { canEditEvent } from "@/lib/authz/guard";
import { idParam } from "@/lib/contracts/common";
import { updateScoreSchema } from "@/lib/contracts/event";
import { SCORE_EVENT_TYPES } from "@/lib/live-scores";
import { nextScoreState } from "@/lib/live-score-state";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const scoreSelect = {
  id: true,
  opponentName: true,
  ourScore: true,
  opponentScore: true,
  liveStatus: true,
  period: true,
  scoreUpdatedAt: true,
  visibility: true,
} as const;

/**
 * PATCH /api/v1/events/{id}/score — update a match's live score. Anyone who
 * may edit the event (lib/authz/guard.ts#canEditEvent). Only MATCH and
 * TOURNAMENT events carry a score. The public homepage shows it only when the
 * event's visibility is PUBLIC (lib/live-scores.ts). The status rules live in
 * lib/live-score-state.ts.
 */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const eventId = idParam.parse(params.id);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, type: true, teamId: true, status: true, liveStatus: true, ourScore: true, opponentScore: true },
  });
  if (!event) throw new NotFoundError("That event wasn't found.");
  if (!canEditEvent(session, event)) throw new ForbiddenError("You don't run this match.");

  if (!(SCORE_EVENT_TYPES as readonly string[]).includes(event.type)) {
    throw new BadRequestError("Only matches and tournaments have a score.");
  }
  if (event.status === "CANCELLED") throw new BadRequestError("This match was cancelled.");

  const json = await req.json().catch(() => {
    throw new BadRequestError("The request body isn't valid JSON.");
  });
  const body = updateScoreSchema.parse(json);

  const next = nextScoreState(event.liveStatus, body);
  if (!next.ok) throw new BadRequestError(next.error);
  const { patch } = next;

  const updated = await prisma.$transaction(async (tx) => {
    // Taps are applied in one row-locked UPDATE, so quick taps or two scorers
    // never overwrite each other. COALESCE starts a null score from 0;
    // GREATEST/LEAST keep it within 0–300 even under concurrent −1s.
    const addOur = body.addOur ?? 0;
    const addOpponent = body.addOpponent ?? 0;
    if (addOur !== 0 || addOpponent !== 0) {
      await tx.$executeRaw`
        UPDATE "Event" SET
          "ourScore" = GREATEST(0, LEAST(300, COALESCE("ourScore", 0) + ${addOur})),
          "opponentScore" = GREATEST(0, LEAST(300, COALESCE("opponentScore", 0) + ${addOpponent}))
        WHERE "id" = ${event.id}`;
    }

    const saved = await tx.event.update({
      where: { id: event.id },
      data: {
        opponentName: body.opponentName,
        ourScore: body.ourScore ?? (patch.zeroNullScores && event.ourScore == null && !addOur ? 0 : undefined),
        opponentScore:
          body.opponentScore ?? (patch.zeroNullScores && event.opponentScore == null && !addOpponent ? 0 : undefined),
        liveStatus: patch.liveStatus,
        period: patch.period,
        scoreUpdatedAt: new Date(),
        ...(patch.completeEvent ? { status: "COMPLETED" as const } : {}),
      },
      select: scoreSelect,
    });

    // Status changes and every change to a finished result are audited; a
    // log row per basket during play would drown the audit trail.
    if (patch.audit) {
      await logAudit(tx, {
        actorUserId: Number(session.user.id),
        action: patch.audit === "CORRECTED" ? "MATCH_SCORE_CORRECTED" : "MATCH_SCORE_STATUS_CHANGED",
        entityType: "Event",
        entityId: event.id,
        metadata: {
          from: { liveStatus: event.liveStatus, ourScore: event.ourScore, opponentScore: event.opponentScore },
          to: { liveStatus: saved.liveStatus, ourScore: saved.ourScore, opponentScore: saved.opponentScore },
        },
      });
    }
    return saved;
  });

  return ok(updated, { requestId });
});
