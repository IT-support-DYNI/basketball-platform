import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, BadRequestError, ForbiddenError, NotFoundError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { idParam } from "@/lib/contracts/common";
import { updateScoreSchema } from "@/lib/contracts/event";
import { SCORE_EVENT_TYPES } from "@/lib/live-scores";
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
 * PATCH /api/v1/events/{id}/score — update a match's live score. The team's
 * coaches (anyone who may edit the event) or an admin. Only MATCH and
 * TOURNAMENT events carry a score. The public homepage shows it only when the
 * event's visibility is PUBLIC (lib/live-scores.ts).
 */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const eventId = idParam.parse(params.id);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, type: true, teamId: true, status: true, liveStatus: true },
  });
  if (!event) throw new NotFoundError("That event wasn't found.");

  const canEdit =
    session.user.role === "ADMIN" ||
    (event.teamId != null && authorize(session).can("update", "Event", { teamId: event.teamId }));
  if (!canEdit) throw new ForbiddenError("You don't run this match.");

  if (!(SCORE_EVENT_TYPES as readonly string[]).includes(event.type)) {
    throw new BadRequestError("Only matches and tournaments have a score.");
  }
  if (event.status === "CANCELLED") throw new BadRequestError("This match was cancelled.");

  const body = updateScoreSchema.parse(await req.json());

  // Starting the clock (or recording any score) moves an unstarted match to LIVE.
  const touchesScore = body.ourScore !== undefined || body.opponentScore !== undefined;
  const liveStatus =
    body.liveStatus ?? (touchesScore && (event.liveStatus == null || event.liveStatus === "UPCOMING") ? "LIVE" : undefined);

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.event.update({
      where: { id: event.id },
      data: {
        opponentName: body.opponentName === undefined ? undefined : body.opponentName || null,
        ourScore: body.ourScore,
        opponentScore: body.opponentScore,
        liveStatus,
        // Tip-off defaults to the first quarter; full time clears the period.
        period:
          liveStatus === "FINAL"
            ? null
            : body.period !== undefined
              ? body.period
              : liveStatus === "LIVE" && (event.liveStatus == null || event.liveStatus === "UPCOMING")
                ? 1
                : undefined,
        scoreUpdatedAt: new Date(),
        // A finished match is a completed event.
        ...(liveStatus === "FINAL" ? { status: "COMPLETED" as const } : {}),
      },
      select: scoreSelect,
    });
    // Only status changes are audited — a log row per basket would drown the audit trail.
    if (liveStatus && liveStatus !== event.liveStatus) {
      await logAudit(tx, {
        actorUserId: Number(session.user.id),
        action: "MATCH_SCORE_STATUS_CHANGED",
        entityType: "Event",
        entityId: event.id,
        metadata: { from: event.liveStatus, to: liveStatus, ourScore: saved.ourScore, opponentScore: saved.opponentScore },
      });
    }
    return saved;
  });

  return ok(updated, { requestId });
});
