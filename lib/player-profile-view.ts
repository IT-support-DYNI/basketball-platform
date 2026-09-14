import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/season";
import { resolvePlayerViewerScope, serializePlayerProfile } from "@/lib/authz/field-visibility";
import { playerTeamIds } from "@/lib/roster";
import { computeAttendanceStats } from "@/lib/attendance";
import { getPlaybackUrl } from "@/lib/storage";

/** photoUrl stores a private-bucket key ("player-photos/<uuid>"), never a
 *  bare public URL — resolved to a short-lived signed GET fresh on every
 *  load, same rule the app already applies to video. Falls back to null
 *  (not the raw key) if storage isn't configured or the value predates this
 *  and is something else entirely — a broken image is worse than no image,
 *  the initials-avatar fallback already handles "no photo" cleanly. */
async function resolvePhotoUrl(stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null;
  if (!stored.startsWith("player-photos/")) return null;
  try {
    return await getPlaybackUrl(stored, 3600);
  } catch {
    return null;
  }
}

/**
 * One read model for a rich, NBA.com-style player profile page — used by both
 * the coach-facing player detail view and the player's own profile. Same
 * field-visibility engine as the API (lib/authz/field-visibility.ts): nothing
 * this function returns has skipped that check.
 */
function ageFromDob(dob: Date | null): number | null {
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export async function loadPlayerProfileView(playerId: number, session: Session) {
  const season = await getActiveSeason();

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      memberships: {
        where: { status: { notIn: ["FORMER", "INACTIVE"] } },
        include: { team: { select: { id: true, name: true } } },
      },
      highlights: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!player) return null;

  const teamIds = playerTeamIds(player);
  const scope = await resolvePlayerViewerScope(session, { id: player.id, userId: player.userId, teamIds });
  const { user, memberships, highlights: rawHighlights, ...rest } = player;
  const visible = serializePlayerProfile(rest, scope);

  // Highlights aren't a PlayerProfile scalar, so serializePlayerProfile never
  // sees them — same bio/photoUrl visibility rule, applied by hand.
  const canSeePublicFields = scope.kinds.has("PUBLIC") ? rest.publicProfileApproved === true : true;
  const highlights = canSeePublicFields
    ? rawHighlights.map((h) => ({ id: h.id, title: h.title, url: h.url }))
    : [];

  const currentMembership =
    memberships.find((m) => m.seasonId === season.id) ?? memberships[0] ?? null;

  // Performance numbers are treated the same as the player dashboard already
  // does — self, the player's own coaches, and admins only. A teammate or the
  // wider club can see the roster fact-sheet (height, country, bio…) but not
  // form scores.
  const canSeeStats = scope.isSelf || scope.kinds.has("TEAM_COACH") || scope.kinds.has("ADMIN");

  let attendancePct: number | null = null;
  let weeklyForm: number | null = null;
  let attendanceBreakdown: { present: number; late: number; absent: number; excused: number } | null = null;
  let latestFeedback: { message: string; coachName: string; createdAt: Date } | null = null;
  if (canSeeStats) {
    const [records, evaluation, feedback] = await Promise.all([
      prisma.attendanceRecord.findMany({ where: { playerId }, select: { status: true } }),
      prisma.performanceEvaluation.findFirst({
        where: { playerId, periodType: "WEEKLY" },
        orderBy: { periodStart: "desc" },
      }),
      prisma.feedback.findFirst({
        where: { playerId },
        orderBy: { createdAt: "desc" },
        include: { coach: { include: { user: { select: { name: true } } } } },
      }),
    ]);
    const stats = computeAttendanceStats(records);
    attendancePct = stats.percentage ?? null;
    attendanceBreakdown = { present: stats.present, late: stats.late, absent: stats.absent, excused: stats.excused };
    weeklyForm = evaluation ? Number(evaluation.overallScore) : null;
    latestFeedback = feedback
      ? { message: feedback.message, coachName: feedback.coach.user.name, createdAt: feedback.createdAt }
      : null;
  }

  const photoUrl = await resolvePhotoUrl((visible as { photoUrl?: string | null }).photoUrl);

  return {
    id: player.id,
    name: user.name,
    photoUrl,
    bio: (visible as { bio?: string | null }).bio ?? null,
    nationality: (visible as { nationality?: string | null }).nationality ?? null,
    heightCm: (visible as { heightCm?: number | null }).heightCm ?? null,
    weightKg: (visible as { weightKg?: number | null }).weightKg ?? null,
    preferredHand: (visible as { preferredHand?: string | null }).preferredHand ?? null,
    age: ageFromDob((visible as { dateOfBirth?: Date | null }).dateOfBirth ?? null),
    team: currentMembership?.team.name ?? null,
    position: currentMembership?.position ?? null,
    jerseyNumber: currentMembership?.jerseyNumber ?? null,
    status: currentMembership?.status ?? null,
    isSelf: scope.isSelf,
    canSeeStats,
    attendancePct,
    weeklyForm,
    attendanceBreakdown,
    latestFeedback,
    highlights,
  };
}

export type PlayerProfileView = NonNullable<Awaited<ReturnType<typeof loadPlayerProfileView>>>;
