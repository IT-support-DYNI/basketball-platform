import { Prisma, type MembershipStatus, type PlayerPosition } from "@prisma/client";

import { prisma } from "./prisma";
import { ConflictError, NotFoundError } from "./api/errors";

/**
 * Roster operations against the season-scoped TeamMembership.
 *
 * The "no two active players share a jersey number in a team + season" rule is a
 * partial unique index in the database (see the organisation_model migration),
 * so it holds even under concurrent requests — the loser gets a P2002 which we
 * translate to a friendly 409.
 *
 * `PlayerProfile.teamId/jerseyNumber/position/status` are kept in sync with the
 * player's *current* active membership while the session/jwt layer still reads
 * them (removed in W4 part 2).
 */

type MembershipFields = {
  jerseyNumber?: number | null;
  position?: PlayerPosition | null;
  secondaryPosition?: PlayerPosition | null;
  squadId?: number | null;
  status?: MembershipStatus;
};

function mapJerseyConflict(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw new ConflictError(
      "Another active player on this team already has that jersey number this season.",
    );
  }
  throw err;
}

/** Add a player to a team's roster for a season (or reactivate an existing
 *  membership). */
export async function addToRoster(
  playerProfileId: number,
  teamId: number,
  seasonId: number,
  fields: MembershipFields,
) {
  const player = await prisma.playerProfile.findUnique({ where: { id: playerProfileId } });
  if (!player) throw new NotFoundError("That player wasn't found.");

  try {
    const membership = await prisma.$transaction(async (tx) => {
      const saved = await tx.teamMembership.upsert({
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
        update: {
          status: fields.status ?? "ACTIVE",
          leftAt: null,
          ...pick(fields),
        },
      });
      await syncPlayerProfile(tx, playerProfileId);
      return saved;
    });
    return membership;
  } catch (err) {
    mapJerseyConflict(err);
  }
}

export async function updateMembership(membershipId: number, fields: MembershipFields) {
  const existing = await prisma.teamMembership.findUnique({ where: { id: membershipId } });
  if (!existing) throw new NotFoundError("That membership wasn't found.");

  try {
    return await prisma.$transaction(async (tx) => {
      const saved = await tx.teamMembership.update({
        where: { id: membershipId },
        data: {
          ...pick(fields),
          ...(fields.status ? { status: fields.status } : {}),
          ...(fields.status === "FORMER" ? { leftAt: new Date() } : {}),
        },
      });
      await syncPlayerProfile(tx, existing.playerProfileId);
      return saved;
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

  await prisma.$transaction(async (tx) => {
    await tx.teamMembership.update({
      where: { id: membership.id },
      data: { status: "FORMER", leftAt: new Date(), jerseyNumber: null },
    });
    await syncPlayerProfile(tx, playerProfileId);
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

/** Mirror the player's current active membership onto the (deprecated) profile
 *  columns the session layer still reads. */
async function syncPlayerProfile(tx: Prisma.TransactionClient, playerProfileId: number) {
  const current = await tx.teamMembership.findFirst({
    where: { playerProfileId, status: { notIn: ["FORMER", "INACTIVE"] } },
    orderBy: { updatedAt: "desc" },
  });

  await tx.playerProfile.update({
    where: { id: playerProfileId },
    data: current
      ? {
          teamId: current.teamId,
          jerseyNumber: current.jerseyNumber,
          position: current.position,
          status: current.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        }
      : { teamId: null, jerseyNumber: null, position: null, status: "INACTIVE" },
  });
}
