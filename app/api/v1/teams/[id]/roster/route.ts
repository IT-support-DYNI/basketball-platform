import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, created, ConflictError, BadRequestError } from "@/lib/api";
import { requireRole, requireTeamAccess } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { addMembershipSchema } from "@/lib/contracts/organisation";
import { getActiveSeason } from "@/lib/season";
import { getTenantContext } from "@/lib/tenant";
import { addToRoster } from "@/lib/roster";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/teams/:id/roster — add an *existing* player to this team's roster
 * for the active season (or reactivate a past membership). Provisioning a new
 * account is POST /api/v1/teams/:id/players.
 */
export const POST = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const body = addMembershipSchema.parse(await req.json());
  const ctx = await getTenantContext(session);
  const season = await getActiveSeason(ctx.clubId);

  const player = await prisma.playerProfile.findUnique({
    where: { id: body.playerProfileId },
    select: { registrationStatus: true },
  });
  if (!player) throw new BadRequestError("That player wasn't found.");
  if (player.registrationStatus !== "APPROVED") {
    throw new BadRequestError("That player's registration isn't approved yet.");
  }

  if (body.jerseyNumber != null) {
    const clash = await prisma.teamMembership.findFirst({
      where: { teamId, seasonId: season.id, status: "ACTIVE", jerseyNumber: body.jerseyNumber },
    });
    if (clash) {
      throw new ConflictError(
        "Another active player on this team already has that jersey number this season.",
      );
    }
  }

  const membership = await addToRoster(body.playerProfileId, teamId, season.id, {
    jerseyNumber: body.jerseyNumber ?? null,
    position: body.position ?? null,
    secondaryPosition: body.secondaryPosition ?? null,
    squadId: body.squadId ?? null,
    status: body.status ?? "ACTIVE",
  });

  return created(membership, requestId);
});
