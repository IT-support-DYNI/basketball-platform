import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, NotFoundError, BadRequestError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { reviewRegistrationSchema } from "@/lib/contracts/registration";
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
export const PATCH = route<{ id: string }>(async (req, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = reviewRegistrationSchema.parse(await req.json());
  const playerId = Number(params.id);

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    include: { user: { select: { emailVerifiedAt: true } } },
  });
  if (!player) throw new NotFoundError("That registration wasn't found.");

  if (body.decision === "APPROVE" && !body.teamId && !player.teamId) {
    throw new BadRequestError("A team must be assigned to approve this registration.");
  }
  if (body.decision === "APPROVE" && !player.user.emailVerifiedAt) {
    throw new BadRequestError(
      "This applicant hasn't confirmed their email address yet — they need to click the link before you can approve them.",
    );
  }

  const newStatus = DECISION_TO_STATUS[body.decision];
  const targetTeamId = body.decision === "APPROVE" ? (body.teamId ?? player.teamId) : player.teamId;

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.playerProfile.update({
      where: { id: playerId },
      data: {
        registrationStatus: newStatus,
        registrationReviewNote: body.note,
        registrationReviewedByUserId: Number(session.user.id),
        registrationReviewedAt: new Date(),
        teamId: targetTeamId,
      },
      include: { user: { select: { id: true } } },
    });

    // Approval puts the player on the team's roster for the active season,
    // carrying whatever jersey/position they asked for at registration.
    if (body.decision === "APPROVE" && targetTeamId) {
      const team = await tx.team.findUnique({ where: { id: targetTeamId }, select: { clubId: true } });
      const activeSeason = await tx.season.findFirst({
        where: team?.clubId != null ? { clubId: team.clubId, isActive: true } : { isActive: true },
        orderBy: { startDate: "desc" },
      });
      if (activeSeason) {
        await tx.teamMembership.upsert({
          where: {
            playerProfileId_teamId_seasonId: {
              playerProfileId: playerId,
              teamId: targetTeamId,
              seasonId: activeSeason.id,
            },
          },
          create: {
            playerProfileId: playerId,
            teamId: targetTeamId,
            seasonId: activeSeason.id,
            status: "ACTIVE",
            position: player.position,
            // Jersey left null on purpose — an admin assigns it, avoiding an
            // accidental clash from a self-registered preference.
          },
          update: { status: "ACTIVE", leftAt: null },
        });
      }
    }

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

  return ok(updated, { requestId });
});
