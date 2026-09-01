import { cache } from "react";
import type { Session } from "next-auth";

import { prisma } from "./prisma";
import { getOrCreateDefaultClub } from "./club";
import { ForbiddenError } from "./api/errors";

/**
 * Row-level tenancy.
 *
 * The platform runs one club today but the data model is multi-tenant. Every
 * query for club-owned data should be scoped to the caller's club so a second
 * club is additive, not a rewrite (brief §5). This module is that seam:
 *   - getTenantContext(session) → the caller's clubId
 *   - assertSameClub(resourceClubId, ctx) → 403 on a cross-club id
 *   - teamClubScope(ctx) → a Prisma `where` fragment for Team queries
 *
 * `Team.clubId` is still nullable (teams created before the Club model). Those
 * legacy teams are treated as in-scope for the single-club deployment; making
 * the column NOT NULL + a Prisma client extension for automatic scoping is the
 * next step and needs a migration window.
 */

export type TenantContext = { clubId: number };

export const getTenantContext = cache(async (session: Session): Promise<TenantContext> => {
  if (session.user.role === "ADMIN") {
    const club = await getOrCreateDefaultClub();
    return { clubId: club.id };
  }

  const teamId = session.user.teamId ?? session.user.teamIds?.[0];
  if (teamId != null) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { clubId: true },
    });
    if (team?.clubId != null) return { clubId: team.clubId };
  }

  const club = await getOrCreateDefaultClub();
  return { clubId: club.id };
});

export function assertSameClub(
  resourceClubId: number | null | undefined,
  ctx: TenantContext,
): void {
  if (resourceClubId != null && resourceClubId !== ctx.clubId) {
    throw new ForbiddenError("That belongs to a different club.");
  }
}

/** Prisma `where` fragment scoping a Team query to the caller's club. Legacy
 *  unassigned teams (clubId null) stay visible in the single-club deployment. */
export function teamClubScope(ctx: TenantContext) {
  return { OR: [{ clubId: ctx.clubId }, { clubId: null }] };
}
