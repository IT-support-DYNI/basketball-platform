import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";

/**
 * Who can see a given Video row: Admin — every video. Coach — videos for
 * their own teams, plus ones they uploaded themselves. Player/guardian —
 * videos assigned to their team or to them personally.
 *
 * Shared by the list route (GET /api/v1/videos) and the single-video route
 * (GET /api/v1/videos/[id]) so a signed playback URL is never handed out
 * for a video the caller isn't allowed to see, by construction rather than
 * by remembering to duplicate the check.
 */
export function visibleVideoWhere(session: Session): Prisma.VideoWhereInput {
  if (session.user.role === "ADMIN") return {};

  if (session.user.role === "COACH") {
    return {
      OR: [
        { uploadedByUserId: Number(session.user.id) },
        { assignments: { some: { teamId: { in: session.user.teamIds ?? [] } } } },
      ],
    };
  }

  return {
    assignments: {
      some: {
        OR: [
          { teamId: session.user.teamId ?? -1 },
          { playerId: session.user.playerId ?? -1 },
        ],
      },
    },
  };
}
