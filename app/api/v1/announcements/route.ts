import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess } from "@/lib/authorization";
import { createAnnouncementSchema } from "@/lib/contracts/announcement";
import { notifyUsers, teamPlayerUserIds } from "@/lib/notify";
import { sendPushToUsers } from "@/lib/push";
import { prisma } from "@/lib/prisma";

/** Platform-wide announcements, plus whichever team-scoped ones are relevant to the caller. */
export const GET = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));

  let teamFilter;
  if (session.user.role === "ADMIN") {
    teamFilter = {};
  } else if (session.user.role === "COACH") {
    teamFilter = { OR: [{ scope: "PLATFORM" as const }, { teamId: { in: session.user.teamIds ?? [] } }] };
  } else {
    teamFilter = {
      OR: [{ scope: "PLATFORM" as const }, { teamId: session.user.teamId ?? -1 }],
    };
  }

  const announcements = await prisma.announcement.findMany({
    where: teamFilter,
    include: { author: { select: { name: true } }, team: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(announcements);
});

/** Admin: platform-wide or any team. Coach: their own team only. */
export const POST = route(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const body = createAnnouncementSchema.parse(await req.json());

  if (session.user.role === "COACH") {
    if (body.scope !== "TEAM") {
      return NextResponse.json({ error: "Coaches can only post team-scoped announcements" }, { status: 403 });
    }
    requireTeamAccess(session, body.teamId!);
  }

  let recipientUserIds: number[] = [];

  const announcement = await prisma.$transaction(async (tx) => {
    const created = await tx.announcement.create({
      data: {
        authorUserId: Number(session.user.id),
        scope: body.scope,
        teamId: body.scope === "TEAM" ? body.teamId : undefined,
        title: body.title,
        body: body.body,
      },
    });

    recipientUserIds =
      body.scope === "TEAM" && body.teamId
        ? await teamPlayerUserIds(tx, body.teamId)
        : (await tx.user.findMany({ where: { role: "PLAYER" }, select: { id: true } })).map((u) => u.id);

    await notifyUsers(tx, recipientUserIds, {
      type: "ANNOUNCEMENT",
      title: `Announcement: ${body.title}`,
      message: body.body.length > 120 ? `${body.body.slice(0, 117)}...` : body.body,
      linkPath: "/player/notifications",
    });

    return created;
  });

  await sendPushToUsers(recipientUserIds, {
    title: `Announcement: ${body.title}`,
    body: body.body.length > 120 ? `${body.body.slice(0, 117)}...` : body.body,
    url: "/player/notifications",
  });

  return NextResponse.json(announcement, { status: 201 });
});
