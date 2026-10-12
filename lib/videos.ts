import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";

/**
 * Who can see a given Video row: Admin — every video. Coach — videos for
 * their own teams, plus ones they uploaded themselves. Player — videos
 * assigned to their team or to them personally. Guardians carry no
 * teamId/playerId in their session, so they match no videos (there is no
 * guardian video screen).
 *
 * Used by GET /api/v1/videos and GET /api/v1/videos/[id]. Pages that query
 * videos directly must apply their own scope.
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

const ACTIVE_MEMBERSHIP = { notIn: ["FORMER", "INACTIVE"] as ("FORMER" | "INACTIVE")[] };

/**
 * Which of a visible video's assignments the caller may see. Admin — all.
 * Coach — assignments to their teams, or to players currently on them.
 * Everyone else — their own team's assignment and their own personal one,
 * never which other players or teams were given the video.
 *
 * Use as the `where` on a nested `assignments` include/select. It filters
 * the assignment rows only; whether the video itself is visible is
 * visibleVideoWhere's job.
 */
export function visibleAssignmentWhere(session: Session): Prisma.VideoAssignmentWhereInput {
  if (session.user.role === "ADMIN") return {};

  if (session.user.role === "COACH") {
    const teamIds = session.user.teamIds ?? [];
    return {
      OR: [
        { teamId: { in: teamIds } },
        { player: { memberships: { some: { teamId: { in: teamIds }, status: ACTIVE_MEMBERSHIP } } } },
      ],
    };
  }

  return {
    OR: [{ teamId: session.user.teamId ?? -1 }, { playerId: session.user.playerId ?? -1 }],
  };
}

/**
 * The only assignment fields that ever leave the server: ids and names.
 * Always `select`, never `include`: an include returns every column of the
 * related rows (password hash, calendar token, medical and welfare notes).
 */
export const videoAssignmentSelect = {
  id: true,
  teamId: true,
  playerId: true,
  team: { select: { id: true, name: true } },
  player: { select: { id: true, user: { select: { name: true } } } },
} satisfies Prisma.VideoAssignmentSelect;
