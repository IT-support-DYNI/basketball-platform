import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, AuthorizationError } from "@/lib/authorization";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/** Self-service: a player whose registration was sent back for changes resubmits it for another review. */
export const POST = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = Number(params.id);

  if (session.user.role !== "PLAYER" || session.user.playerId !== playerId) {
    throw new AuthorizationError("You can only resubmit your own registration");
  }

  const player = await prisma.playerProfile.findUnique({ where: { id: playerId } });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (player.registrationStatus !== "CHANGES_REQUESTED") {
    return NextResponse.json({ error: "Only a registration marked 'changes requested' can be resubmitted." }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.playerProfile.update({
      where: { id: playerId },
      data: { registrationStatus: "PENDING", registrationSubmittedAt: new Date() },
    });

    await logAudit(tx, {
      actorUserId: Number(session.user.id),
      action: "REGISTRATION_RESUBMITTED",
      entityType: "PlayerProfile",
      entityId: playerId,
    });

    return saved;
  });

  return NextResponse.json(updated);
});
