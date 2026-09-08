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

async function resolvePhotoUrl(stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null;
  if (!stored.startsWith("player-photos/") && !stored.startsWith("coach-photos/")) return null;
  try {
    return await getPlaybackUrl(stored, 3600);
  } catch {
    return null;
  }
}

export async function getClubStats() {
  const [teams, players, coaches, seasons] = await Promise.all([
    prisma.team.count({ where: { status: "ACTIVE" } }),
    prisma.playerProfile.findMany({
      select: { id: true },
      where: { memberships: { some: { status: { notIn: ["FORMER", "INACTIVE"] } } } },
    }),
    prisma.coachProfile.count(),
    prisma.season.count({ where: { isActive: true } }),
  ]);
  return { teams, players: players.length, coaches, seasons: seasons || 1 };
}

export async function getPublicTeams() {
  return prisma.team.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, ageGroup: true, description: true },
    orderBy: { name: "asc" },
  });
}

export type PublicPlayerCard = {
  id: number;
  name: string;
  photoUrl: string | null;
  position: string | null;
  team: string | null;
  bio: string | null;
};

/** Roster cards for the public "meet the team" grid — approved players only. */
export async function getPublicPlayers(limit = 12): Promise<PublicPlayerCard[]> {
  const players = await prisma.playerProfile.findMany({
    where: { publicProfileApproved: true },
    include: {
      user: { select: { name: true } },
      memberships: {
        where: { status: { notIn: ["FORMER", "INACTIVE"] } },
        include: { team: { select: { name: true } } },
        take: 1,
      },
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(
    players.map(async (p) => ({
      id: p.id,
      name: p.user.name,
      photoUrl: await resolvePhotoUrl(p.photoUrl),
      position: p.memberships[0]?.position ?? null,
      team: p.memberships[0]?.team.name ?? null,
      bio: p.bio,
    })),
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
        include: { team: { select: { name: true } } },
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

  return {
    id: player.id,
    name: player.user.name,
    photoUrl: await resolvePhotoUrl((visible as { photoUrl?: string | null }).photoUrl),
    position: player.memberships[0]?.position ?? null,
    team: player.memberships[0]?.team.name ?? null,
    bio: (visible as { bio?: string | null }).bio ?? null,
    // heightCm/weightKg/nationality aren't PUBLIC-tier (field-visibility.ts)
    // — deliberately not on this type at all, not just nulled out.
    jerseyNumber: player.memberships[0]?.jerseyNumber ?? null,
    highlights: player.highlights.map((h) => ({ id: h.id, title: h.title, url: h.url })),
  };
}

export type PublicCoachCard = {
  id: number;
  name: string;
  photoUrl: string | null;
  bio: string | null;
};

export async function getPublicCoaches(limit = 12): Promise<PublicCoachCard[]> {
  const coaches = await prisma.coachProfile.findMany({
    where: { publicProfileApproved: true },
    include: { user: { select: { name: true } } },
    take: limit,
    orderBy: { id: "desc" },
  });
  return Promise.all(
    coaches.map(async (c) => ({
      id: c.id,
      name: c.user.name,
      photoUrl: await resolvePhotoUrl(c.photoUrl),
      bio: c.bio,
    })),
  );
}

export async function getPublicCoach(coachId: number): Promise<PublicCoachCard | null> {
  const coach = await prisma.coachProfile.findUnique({
    where: { id: coachId },
    include: { user: { select: { name: true } } },
  });
  if (!coach || !coach.publicProfileApproved) return null;
  return { id: coach.id, name: coach.user.name, photoUrl: await resolvePhotoUrl(coach.photoUrl), bio: coach.bio };
}
