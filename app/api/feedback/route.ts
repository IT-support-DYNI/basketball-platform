import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireRole, requirePlayerAccess } from "@/lib/authorization";
import { createFeedbackSchema } from "@/lib/validation/feedback";
import { notifyUser } from "@/lib/notify";
import { sendPushToUser } from "@/lib/push";
import { prisma } from "@/lib/prisma";

/** Coach only, per the PRD permission matrix ("Write player feedback"). */
export const POST = withApi(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const body = createFeedbackSchema.parse(await req.json());

  const player = await prisma.playerProfile.findUnique({ where: { id: body.playerId } });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  requirePlayerAccess(session, player);

  const feedback = await prisma.$transaction(async (tx) => {
    const created = await tx.feedback.create({
      data: {
        playerId: body.playerId,
        coachId: session.user.coachProfileId!,
        evaluationId: body.evaluationId,
        sessionId: body.sessionId,
        message: body.message,
      },
    });

    await notifyUser(tx, {
      userId: player.userId,
      type: "NEW_FEEDBACK",
      title: "New feedback from your coach",
      message: body.message.length > 120 ? `${body.message.slice(0, 117)}...` : body.message,
      linkPath: "/player/feedback",
    });

    return created;
  });

  await sendPushToUser(player.userId, {
    title: "New feedback from your coach",
    body: body.message.length > 120 ? `${body.message.slice(0, 117)}...` : body.message,
    url: "/player/feedback",
  });

  return NextResponse.json(feedback, { status: 201 });
});
