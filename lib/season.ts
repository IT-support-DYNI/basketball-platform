import { cache } from "react";

import { prisma } from "./prisma";
import { getOrCreateDefaultClub } from "./club";
import { NotFoundError } from "./api/errors";

/**
 * The club's current season. Season-scoped data (rosters, memberships, squads)
 * always resolves against this unless a specific season is asked for.
 */
export const getActiveSeason = cache(async (clubId?: number) => {
  const club = clubId != null ? { id: clubId } : await getOrCreateDefaultClub();

  const existing = await prisma.season.findFirst({
    where: { clubId: club.id, isActive: true },
    orderBy: { startDate: "desc" },
  });
  if (existing) return existing;

  // No season configured yet — create one spanning the current year so the
  // roster tools have something to attach to. An admin can rename/adjust it.
  const now = new Date();
  const year = now.getFullYear();
  return prisma.season.create({
    data: {
      clubId: club.id,
      name: `${year}–${year + 1}`,
      startDate: new Date(year, 7, 1), // 1 Aug
      endDate: new Date(year + 1, 6, 31), // 31 Jul
      isActive: true,
    },
  });
});

export async function requireSeason(seasonId: number) {
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) throw new NotFoundError("That season wasn't found.");
  return season;
}
