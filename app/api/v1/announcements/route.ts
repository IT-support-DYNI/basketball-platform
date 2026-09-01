import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created, ForbiddenError } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess } from "@/lib/authorization";
import { createAnnouncementSchema } from "@/lib/contracts/announcement";
import { announcementsFor, announcementAudience } from "@/lib/announcements";
import { notifyUsers } from "@/lib/notify";
import { sendPushToUsers } from "@/lib/push";
import { prisma } from "@/lib/prisma";

/** Everything the caller can see, pinned first, with their acknowledgement state. */
export const GET = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));
  return ok(await announcementsFor(session));
});

/** Admin: PLATFORM or any team. Coach: their own team only. */
export const POST = route(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const body = createAnnouncementSchema.parse(await req.json());

  if (session.user.role === "COACH") {
    if (body.scope !== "TEAM") throw new ForbiddenError("Coaches can only post team-scoped announcements.");
    requireTeamAccess(session, body.teamId!);
  }

  const preview = body.body.length > 120 ? `${body.body.slice(0, 117)}…` : body.body;
  let recipients: number[] = [];

  const announcement = await prisma.$transaction(async (tx) => {
    const a = await tx.announcement.create({
      data: {
        authorUserId: Number(session.user.id),
        scope: body.scope,
        teamId: body.scope === "TEAM" ? body.teamId : null,
        title: body.title,
        body: body.body,
        requiresAck: body.requiresAck,
        pinnedUntil: body.pinnedUntil ? new Date(body.pinnedUntil) : null,
      },
    });
    recipients = (await announcementAudience(tx, a)).filter((id) => id !== Number(session.user.id));
    await notifyUsers(tx, recipients, {
      type: "ANNOUNCEMENT",
      title: `${body.requiresAck ? "Please read: " : "Announcement: "}${body.title}`,
      message: preview,
      linkPath: "/announcements",
      dedupeKey: `announcement:${a.id}`,
    });
    return a;
  });

  await sendPushToUsers(recipients, {
    title: `${body.requiresAck ? "Please read: " : "Announcement: "}${body.title}`,
    body: preview,
    url: "/announcements",
  }, "ANNOUNCEMENTS");

  return created(announcement);
});
