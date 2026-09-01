import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, ForbiddenError, NotFoundError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { ackBreakdown } from "@/lib/announcements";
import { prisma } from "@/lib/prisma";

/** GET — who has / hasn't acknowledged. Author or admin only. */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const announcement = await prisma.announcement.findUnique({
    where: { id: Number(params.id) },
    select: { authorUserId: true, teamId: true },
  });
  if (!announcement) throw new NotFoundError("That announcement wasn't found.");

  const isAuthor = announcement.authorUserId === Number(session.user.id);
  const isTeamCoach =
    announcement.teamId != null && authorize(session).can("update", "Team", { id: announcement.teamId });
  if (session.user.role !== "ADMIN" && !isAuthor && !isTeamCoach) {
    throw new ForbiddenError("You can only see acknowledgements for announcements you posted.");
  }

  const breakdown = await ackBreakdown(Number(params.id));
  if (!breakdown) throw new NotFoundError("That announcement wasn't found.");
  return ok(breakdown);
});
