import type { DrillCategory, DrillDifficulty, Prisma } from "@prisma/client";

import { prisma } from "./prisma";

/**
 * The drill library (brief §14). One library per club, plus any shared/global
 * drills (`clubId = null`). Coaches read the whole thing and contribute to it;
 * training plans (W9 part 2) reference drills by id.
 */

export type DrillFilters = {
  category?: DrillCategory | null;
  difficulty?: DrillDifficulty | null;
  q?: string | null;
  tag?: string | null;
  includeArchived?: boolean;
};

/** Drills a club can see: its own + the shared global set. */
function visibleTo(clubId: number): Prisma.DrillWhereInput {
  return { OR: [{ clubId }, { clubId: null }] };
}

export async function listDrills(clubId: number, filters: DrillFilters = {}) {
  return prisma.drill.findMany({
    where: {
      AND: [
        visibleTo(clubId),
        filters.includeArchived ? {} : { archivedAt: null },
        filters.category ? { category: filters.category } : {},
        filters.difficulty ? { difficulty: filters.difficulty } : {},
        filters.tag ? { tags: { has: filters.tag } } : {},
        filters.q
          ? {
              OR: [
                { name: { contains: filters.q, mode: "insensitive" } },
                { summary: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { createdBy: { select: { name: true } } },
  });
}

export async function drillById(clubId: number, id: number) {
  const drill = await prisma.drill.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  if (!drill) return null;
  if (drill.clubId != null && drill.clubId !== clubId) return null; // another club's
  return drill;
}
