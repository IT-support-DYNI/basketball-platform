import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireRole, requireTeamAccess } from "@/lib/authorization";
import { assignVideoSchema } from "@/lib/contracts/video";
import { notifyUsers, teamPlayerUserIds } from "@/lib/notify";
import { sendPushToUsers } from "@/lib/push";
import { playerTeamIds, playerTeamIdsSelect } from "@/lib/roster";
import { ForbiddenError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export const POST = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const videoId = Number(params.id);
  const body = assignVideoSchema.parse(await req.json());

  const teamIds = body.teamIds ?? [];
  const playerIds = body.playerIds ?? [];
  teamIds.forEach((teamId) => requireTeamAccess(session, teamId));

  if (playerIds.length > 0) {
    const players = await prisma.playerProfile.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, ...playerTeamIdsSelect },
    });
    const accessible = new Set(session.user.teamIds ?? []);
    players.forEach((p) => {
      if (!playerTeamIds(p).some((teamId) => accessible.has(teamId))) {
        throw new ForbiddenError("You don't have access to one or more of those players.");
      }
    });
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const recipientUserIds = await prisma.$transaction(async (tx) => {
    await tx.videoAssignment.createMany({
      data: [
        ...teamIds.map((teamId) => ({ videoId, teamId })),
        ...playerIds.map((playerId) => ({ videoId, playerId })),
      ],
    });

    const teamUserIds = (
      await Promise.all(teamIds.map((teamId) => teamPlayerUserIds(tx, teamId)))
    ).flat();
    const directPlayerUserIds = playerIds.length
      ? (
          await tx.playerProfile.findMany({
            where: { id: { in: playerIds } },
            select: { userId: true },
          })
        ).map((p) => p.userId)
      : [];

    const recipients = Array.from(new Set([...teamUserIds, ...directPlayerUserIds]));

    await notifyUsers(tx, recipients, {
      type: "NEW_VIDEO",
      title: "New training video",
      message: `"${video.title}" was just added to your video library.`,
      linkPath: "/player/videos",
    });

    return recipients;
  });

  await sendPushToUsers(recipientUserIds, {
    title: "New training video",
    body: `"${video.title}" was just added to your video library.`,
    url: "/player/videos",
  }, "VIDEOS");

  return NextResponse.json({ ok: true }, { status: 201 });
});
