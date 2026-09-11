import { prisma } from "@/lib/prisma";
import { PUBLIC_SCOPE, serializePlayerProfile } from "@/lib/authz/field-visibility";
import { getPlaybackUrl } from "@/lib/storage";

/**
 * Read models for the unauthenticated public club site (/club/*, brief §28).
 * Every one of these goes through the same publicProfileApproved gate the
 * rest of the app already uses for exactly this purpose — nothing here is a
 * separate, looser path to the same data. A player or coach who hasn't
 * (or whose guardian hasn't) opted in simply isn't returned, full stop.
 */

/** PlayerPosition enum values are the DB's compact codes (PG/SG/…) — this is
 *  the only place they're expanded to words a visitor with no basketball
 *  background will still understand. */
export const POSITION_LABELS: Record<string, string> = {
  PG: "Point guard",
  SG: "Shooting guard",
  SF: "Small forward",
  PF: "Power forward",
  C: "Centre",
};

const STAFF_ROLE_LABELS: Record<string, string> = {
  HEAD_COACH: "Head coach",
  ASSISTANT_COACH: "Assistant coach",
  TEAM_MANAGER: "Team manager",
  STATISTICIAN: "Statistician",
  MEDICAL_OFFICER: "Medical officer",
  WELFARE_OFFICER: "Welfare officer",
};
// Best single line to show under a coach's name when they hold more than one
// role/team — prefer the roles a visitor most wants to see first.
const STAFF_ROLE_PRIORITY = ["HEAD_COACH", "WELFARE_OFFICER", "ASSISTANT_COACH", "TEAM_MANAGER", "MEDICAL_OFFICER", "STATISTICIAN"];

async function resolvePhotoUrl(stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null;
  if (!stored.startsWith("player-photos/") && !stored.startsWith("coach-photos/")) return null;
  try {
    return await getPlaybackUrl(stored, 3600);
  } catch {
    return null;
  }
}

export type PublicFixture = {
  id: number;
  title: string;
  teamName: string | null;
  startAt: Date;
  venueName: string | null;
};

/** The next publicly-visible match — Event.visibility must be PUBLIC, same
 *  gate as everything else on this page (a TEAM/CLUB-visibility fixture stays
 *  internal). Returns null when there's nothing upcoming to show, which the
 *  page treats as "omit the section" rather than a loading state. */
export async function getNextFixture(): Promise<PublicFixture | null> {
  const match = await prisma.event.findFirst({
    where: { type: "MATCH", status: "SCHEDULED", visibility: "PUBLIC", startAt: { gte: new Date() } },
    include: { team: { select: { name: true } }, venue: { select: { name: true } } },
    orderBy: { startAt: "asc" },
  });
  if (!match) return null;
  return {
    id: match.id,
    title: match.title,
    teamName: match.team?.name ?? null,
    startAt: match.startAt,
    venueName: match.venue?.name ?? match.locationText ?? null,
  };
}

export async function getClubStats() {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [teams, players, coaches, seasons, sessionsThisWeek] = await Promise.all([
    prisma.team.count({ where: { status: "ACTIVE" } }),
    prisma.playerProfile.findMany({
      select: { id: true },
      where: { memberships: { some: { status: { notIn: ["FORMER", "INACTIVE"] } } } },
    }),
    prisma.coachProfile.count(),
    prisma.season.count({ where: { isActive: true } }),
    prisma.event.count({
      where: { type: "TRAINING", status: "SCHEDULED", startAt: { gte: now, lt: inSevenDays } },
    }),
  ]);
  return { teams, players: players.length, coaches, seasons: seasons || 1, sessionsThisWeek };
}

export type PublicTeam = {
  id: number;
  name: string;
  ageGroup: string | null;
  description: string | null;
  memberCount: number;
};

export async function getPublicTeams(): Promise<PublicTeam[]> {
  const teams = await prisma.team.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      ageGroup: true,
      description: true,
      _count: { select: { memberships: { where: { status: { notIn: ["FORMER", "INACTIVE"] } } } } },
    },
    orderBy: { name: "asc" },
  });
  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    ageGroup: t.ageGroup,
    description: t.description,
    memberCount: t._count.memberships,
  }));
}

export type PublicPlayerCard = {
  id: number;
  name: string;
  photoUrl: string | null;
  position: string | null;
  positionLabel: string | null;
  team: string | null;
  ageGroup: string | null;
  jerseyNumber: number | null;
  bio: string | null;
  /** "Active" or "Trialist" only — INJURED/SUSPENDED/PENDING are real
   *  membership states but not ones to publish to a stranger, so those
   *  collapse to null (no pill shown) rather than leaking club-internal
   *  status onto a public card. */
  publicStatus: "Active" | "Trialist" | null;
};

/** Roster cards for the public "meet the team" grid — approved players only. */
export async function getPublicPlayers(limit = 12): Promise<PublicPlayerCard[]> {
  const players = await prisma.playerProfile.findMany({
    where: { publicProfileApproved: true },
    include: {
      user: { select: { name: true } },
      memberships: {
        where: { status: { notIn: ["FORMER", "INACTIVE"] } },
        include: { team: { select: { name: true, ageGroup: true } } },
        take: 1,
      },
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(
    players.map(async (p) => {
      const membership = p.memberships[0];
      const publicStatus: PublicPlayerCard["publicStatus"] =
        membership?.status === "ACTIVE" ? "Active" : membership?.status === "TRIALIST" ? "Trialist" : null;
      return {
        id: p.id,
        name: p.user.name,
        photoUrl: await resolvePhotoUrl(p.photoUrl),
        position: membership?.position ?? null,
        positionLabel: membership?.position ? POSITION_LABELS[membership.position] ?? membership.position : null,
        publicStatus,
        team: membership?.team.name ?? null,
        ageGroup: membership?.team.ageGroup ?? null,
        jerseyNumber: membership?.jerseyNumber ?? null,
        bio: p.bio,
      };
    }),
  );
}

export type PublicPlayerProfile = PublicPlayerCard & {
  jerseyNumber: number | null;
  highlights: { id: number; title: string; url: string }[];
};

/** One player's public page. Returns null for anyone not approved — the
 *  page this feeds renders a 404 in that case, not an empty shell, so
 *  there's no way to tell "not approved" apart from "doesn't exist". */
export async function getPublicPlayer(playerId: number): Promise<PublicPlayerProfile | null> {
  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    include: {
      user: { select: { name: true } },
      memberships: {
        where: { status: { notIn: ["FORMER", "INACTIVE"] } },
        include: { team: { select: { name: true, ageGroup: true } } },
        take: 1,
      },
      highlights: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!player || !player.publicProfileApproved) return null;

  // Belt-and-braces: run the real field-visibility gate too, not just the
  // publicProfileApproved flag, so this stays correct if that function's
  // rules ever change without this file being updated to match.
  const visible = serializePlayerProfile(player, PUBLIC_SCOPE);

  const membership = player.memberships[0];
  const publicStatus: PublicPlayerCard["publicStatus"] =
    membership?.status === "ACTIVE" ? "Active" : membership?.status === "TRIALIST" ? "Trialist" : null;
  return {
    id: player.id,
    name: player.user.name,
    photoUrl: await resolvePhotoUrl((visible as { photoUrl?: string | null }).photoUrl),
    position: membership?.position ?? null,
    positionLabel: membership?.position ? POSITION_LABELS[membership.position] ?? membership.position : null,
    publicStatus,
    team: membership?.team.name ?? null,
    ageGroup: membership?.team.ageGroup ?? null,
    bio: (visible as { bio?: string | null }).bio ?? null,
    // heightCm/weightKg/nationality aren't PUBLIC-tier (field-visibility.ts)
    // — deliberately not on this type at all, not just nulled out.
    jerseyNumber: membership?.jerseyNumber ?? null,
    highlights: player.highlights.map((h) => ({ id: h.id, title: h.title, url: h.url })),
  };
}

export type PublicCoachCard = {
  id: number;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  /** e.g. "Head coach · Blazers Academy" — real StaffAssignment data, null if
   *  the coach isn't currently assigned to a team. Never a fabricated or
   *  unverifiable credential claim (no "DBS checked"-style badge — this site
   *  doesn't have anywhere that fact is actually tracked). */
  roleLine: string | null;
};

function bestRoleLine(
  assignments: { role: string; team: { name: string } }[],
): string | null {
  if (assignments.length === 0) return null;
  const sorted = [...assignments].sort(
    (a, b) => STAFF_ROLE_PRIORITY.indexOf(a.role) - STAFF_ROLE_PRIORITY.indexOf(b.role),
  );
  const best = sorted[0];
  return `${STAFF_ROLE_LABELS[best.role] ?? best.role} · ${best.team.name}`;
}

export async function getPublicCoaches(limit = 12): Promise<PublicCoachCard[]> {
  const coaches = await prisma.coachProfile.findMany({
    where: { publicProfileApproved: true },
    include: {
      user: {
        select: { name: true, staffAssignments: { include: { team: { select: { name: true } } } } },
      },
    },
    take: limit,
    orderBy: { id: "desc" },
  });
  return Promise.all(
    coaches.map(async (c) => ({
      id: c.id,
      name: c.user.name,
      photoUrl: await resolvePhotoUrl(c.photoUrl),
      bio: c.bio,
      roleLine: bestRoleLine(c.user.staffAssignments),
    })),
  );
}

export async function getPublicCoach(coachId: number): Promise<PublicCoachCard | null> {
  const coach = await prisma.coachProfile.findUnique({
    where: { id: coachId },
    include: {
      user: {
        select: { name: true, staffAssignments: { include: { team: { select: { name: true } } } } },
      },
    },
  });
  if (!coach || !coach.publicProfileApproved) return null;
  return {
    id: coach.id,
    name: coach.user.name,
    photoUrl: await resolvePhotoUrl(coach.photoUrl),
    bio: coach.bio,
    roleLine: bestRoleLine(coach.user.staffAssignments),
  };
}
