import { prisma } from "./prisma";

/**
 * This app runs one club today (DYNI Blazers) but the data model supports
 * more — see ARCHITECTURE.md and prisma/schema.prisma's Club model comment.
 * New teams get attached to the first/only club that exists, created on
 * first use rather than requiring a manual setup step. Existing teams from
 * before this model existed stay unassigned (Team.clubId is nullable) —
 * an admin can be given a "assign to club" action once a second club is a
 * real scenario, not before.
 */
export async function getOrCreateDefaultClub() {
  const existing = await prisma.club.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;

  return prisma.club.create({
    data: { name: "DYNI Blazers", minorAgeThreshold: 18 },
  });
}
