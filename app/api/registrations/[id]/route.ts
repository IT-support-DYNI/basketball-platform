import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { reviewRegistrationSchema } from "@/lib/validation/registration";
import { logAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { sendPushToUser } from "@/lib/push";
import { prisma } from "@/lib/prisma";

const DECISION_TO_STATUS = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  REQUEST_CHANGES: "CHANGES_REQUESTED",
} as const;

const DECISION_MESSAGE = {
  APPROVE: "Your registration has been approved — welcome to the team!",
  REJECT: "Your registration was not approved.",
  REQUEST_CHANGES: "Your registration needs a small update before it can be approved.",
} as const;

/** Admin approves, rejects, or requests changes on a pending registration — DYNI Blazers PRD §6 Journey D. */
export const PATCH = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = reviewRegistrationSchema.parse(await req.json());
  const playerId = Number(params.id);

  const player = await prisma.playerProfile.findUnique({ where: { id: playerId } });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.decision === "APPROVE" && !body.teamId && !player.teamId) {
    return NextResponse.json({ error: "A team must be assigned to approve this registration." }, { status: 400 });
  }

  const newStatus = DECISION_TO_STATUS[body.decision];

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.playerProfile.update({
      where: { id: playerId },
      data: {
        registrationStatus: newStatus,
        registrationReviewNote: body.note,
        registrationReviewedByUserId: Number(session.user.id),
        registrationReviewedAt: new Date(),
        teamId: body.decision === "APPROVE" ? (body.teamId ?? player.teamId) : player.teamId,
      },
      include: { user: { select: { id: true } } },
    });

    await logAudit(tx, {
      actorUserId: Number(session.user.id),
      action: `REGISTRATION_${newStatus}`,
      entityType: "PlayerProfile",
      entityId: playerId,
      metadata: { note: body.note, teamId: saved.teamId },
    });

    await notifyUser(tx, {
      userId: saved.user.id,
      type: "REGISTRATION_UPDATE",
      title: DECISION_MESSAGE[body.decision],
      message: body.note ?? DECISION_MESSAGE[body.decision],
      linkPath: newStatus === "APPROVED" ? "/player/dashboard" : "/registration-status",
    });

    return saved;
  });

  await sendPushToUser(updated.user.id, {
    title: DECISION_MESSAGE[body.decision],
    body: body.note ?? DECISION_MESSAGE[body.decision],
    url: newStatus === "APPROVED" ? "/player/dashboard" : "/registration-status",
  });

  return NextResponse.json(updated);
});
