import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, NotFoundError } from "@/lib/api";
import { requireAuth, requireRole, requirePlayerAccess, canViewPlayerContactDetails } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { updatePlayerSchema } from "@/lib/contracts/team";
import { playerTeamIds, playerTeamIdsSelect } from "@/lib/roster";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = idParam.parse(params.id);

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
      memberships: {
        where: { status: { notIn: ["FORMER", "INACTIVE"] } },
        include: { team: { select: { id: true, name: true } }, season: { select: { name: true, isActive: true } } },
      },
    },
  });
  if (!player) throw new NotFoundError("That player wasn't found.");

  const ref = { id: player.id, teamIds: playerTeamIds(player) };
  requirePlayerAccess(session, ref);
  const canSeeContact = canViewPlayerContactDetails(session, ref);

  return ok(
    {
      ...player,
      contactPhone: canSeeContact ? player.contactPhone : undefined,
      guardianName: canSeeContact ? player.guardianName : undefined,
      guardianContact: canSeeContact ? player.guardianContact : undefined,
    },
    { requestId },
  );
});

/**
 * PATCH — profile-level fields only. A player edits their own contact details;
 * an admin/coach can also edit the profile fields. Jersey / position / squad /
 * status are season-scoped: use PATCH /api/v1/memberships/:id.
 */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = idParam.parse(params.id);

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    select: { id: true, ...playerTeamIdsSelect },
  });
  if (!player) throw new NotFoundError("That player wasn't found.");
  requirePlayerAccess(session, { id: player.id, teamIds: playerTeamIds(player) });

  const body = updatePlayerSchema.parse(await req.json());

  if (session.user.role === "PLAYER") {
    const updated = await prisma.playerProfile.update({
      where: { id: playerId },
      data: { contactPhone: body.contactPhone },
    });
    return ok(updated, { requestId });
  }

  requireRole(session, ["ADMIN", "COACH"]);
  const updated = await prisma.playerProfile.update({
    where: { id: playerId },
    data: {
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      photoUrl: body.photoUrl,
      contactPhone: body.contactPhone,
      guardianName: body.guardianName,
      guardianContact: body.guardianContact,
    },
  });

  return ok(updated, { requestId });
});
