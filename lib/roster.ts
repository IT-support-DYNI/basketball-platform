import { Prisma, type MembershipStatus, type PlayerPosition } from "@prisma/client";

import { prisma } from "./prisma";
import { ConflictError, NotFoundError } from "./api/errors";
import type { PlayerRef } from "./authz/guard";

/**
 * Roster operations against the season-scoped TeamMembership — the single
 * source of truth for a player's team, jersey, position and status.
 *
 * The "no two active players share a jersey number in a team + season" rule is
 * a partial unique index in the database (see the organisation_model
 * migration), so it holds even under concurrent requests — the loser gets a
 * P2002 which we translate to a 409.
 */

type MembershipFields = {
  jerseyNumber?: number | null;
  position?: PlayerPosition | null;
  secondaryPosition?: PlayerPosition | null;
  squadId?: number | null;
  status?: MembershipStatus;
};

const NON_FORMER: MembershipStatus[] = ["FORMER", "INACTIVE"];

/** Prisma `include`/`select` fragment to load the team ids an access check needs. */
export const playerTeamIdsSelect = {
  memberships: {
    where: { status: { notIn: NON_FORMER } },
    select: { teamId: true },
  },
} satisfies Prisma.PlayerProfileSelect;

export function playerTeamIds(p: { memberships: { teamId: number }[] }): number[] {
  return [...new Set(p.memberships.map((m) => m.teamId))];
}

/** Load a player's access context (id + current team ids) in one query. */
export async function playerAccessContext(playerProfileId: number): Promise<PlayerRef | null> {
  const player = await prisma.playerProfile.findUnique({
    where: { id: playerProfileId },
    select: { id: true, ...playerTeamIdsSelect },
  });
  return player ? { id: player.id, teamIds: playerTeamIds(player) } : null;
}

/** Prisma `where` fragment: players currently on one or more teams' rosters
 *  (any season by default, or a specific `seasonId`). */
export function rosterPlayerFilter(team: number | number[], seasonId?: number) {
  return {
    memberships: {
      some: {
        teamId: Array.isArray(team) ? { in: team } : team,
        status: { notIn: NON_FORMER },
        ...(seasonId != null ? { seasonId } : {}),
      },
    },
  };
}

function mapJerseyConflict(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw new ConflictError(
      "Another active player on this team already has that jersey number this season.",
    );
  }
  throw err;
}

export async function addToRoster(
  playerProfileId: number,
  teamId: number,
  seasonId: number,
  fields: MembershipFields,
) {
  const player = await prisma.playerProfile.findUnique({ where: { id: playerProfileId } });
  if (!player) throw new NotFoundError("That player wasn't found.");

  try {
    return await prisma.teamMembership.upsert({
      where: { playerProfileId_teamId_seasonId: { playerProfileId, teamId, seasonId } },
      create: {
        playerProfileId,
        teamId,
        seasonId,
        status: fields.status ?? "ACTIVE",
        jerseyNumber: fields.jerseyNumber ?? null,
        position: fields.position ?? null,
        secondaryPosition: fields.secondaryPosition ?? null,
        squadId: fields.squadId ?? null,
      },
      update: { status: fields.status ?? "ACTIVE", leftAt: null, ...pick(fields) },
    });
  } catch (err) {
    mapJerseyConflict(err);
  }
}

export async function updateMembership(membershipId: number, fields: MembershipFields) {
  const existing = await prisma.teamMembership.findUnique({ where: { id: membershipId } });
  if (!existing) throw new NotFoundError("That membership wasn't found.");

  try {
    return await prisma.teamMembership.update({
      where: { id: membershipId },
      data: {
        ...pick(fields),
        ...(fields.status ? { status: fields.status } : {}),
        ...(fields.status === "FORMER" ? { leftAt: new Date() } : {}),
      },
    });
  } catch (err) {
    mapJerseyConflict(err);
  }
}

/** Remove a player from a team's roster: the membership becomes FORMER (kept
 *  for the historical record), never deleted. */
export async function removeFromRoster(playerProfileId: number, teamId: number, seasonId: number) {
  const membership = await prisma.teamMembership.findUnique({
    where: { playerProfileId_teamId_seasonId: { playerProfileId, teamId, seasonId } },
  });
  if (!membership) throw new NotFoundError("That player isn't on this roster.");

  await prisma.teamMembership.update({
    where: { id: membership.id },
    data: { status: "FORMER", leftAt: new Date(), jerseyNumber: null },
  });
}

function pick(fields: MembershipFields) {
  const out: MembershipFields = {};
  if (fields.jerseyNumber !== undefined) out.jerseyNumber = fields.jerseyNumber;
  if (fields.position !== undefined) out.position = fields.position;
  if (fields.secondaryPosition !== undefined) out.secondaryPosition = fields.secondaryPosition;
  if (fields.squadId !== undefined) out.squadId = fields.squadId;
  return out;
}
