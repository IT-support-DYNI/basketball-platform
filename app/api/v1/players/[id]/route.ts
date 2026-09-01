import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, ForbiddenError, NotFoundError } from "@/lib/api";
import { requireAuth, requirePlayerAccess } from "@/lib/authorization";
import { resolvePlayerViewerScope, serializePlayerProfile, canEditPlayerField } from "@/lib/authz/field-visibility";
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

  // No hard gate here: any authenticated member can look up a player, and the
  // field-visibility engine strips everything they're not entitled to see. The
  // hard `requirePlayerAccess` gate stays on the routes that expose bulk
  // personal data (evaluations, attendance, feedback…).
  const teamIds = playerTeamIds(player);
  const scope = await resolvePlayerViewerScope(session, { id: player.id, userId: player.userId, teamIds });
  const { user, memberships, ...profile } = player;
  const visible = serializePlayerProfile(profile, scope);

  return ok({ ...visible, user, memberships }, { requestId });
});

/**
 * PATCH — profile-level fields. A player edits their own record; an admin or a
 * coach on the player's team can edit the operational fields. Medical / welfare
 * notes are locked to the matching officer (or admin / the player).
 * Jersey / position / squad / status are season-scoped: PATCH /memberships/:id.
 */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = idParam.parse(params.id);

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    select: { id: true, userId: true, ...playerTeamIdsSelect },
  });
  if (!player) throw new NotFoundError("That player wasn't found.");
  const teamIds = playerTeamIds(player);
  requirePlayerAccess(session, { id: player.id, teamIds });

  const body = updatePlayerSchema.parse(await req.json());
  const scope = await resolvePlayerViewerScope(session, { id: player.id, userId: player.userId, teamIds });

  const isSelf = session.user.playerId === playerId || scope.isSelf;
  const isStaff = session.user.role === "ADMIN" || scope.kinds.has("TEAM_COACH") || scope.kinds.has("TEAM_WELFARE") || scope.kinds.has("TEAM_MEDICAL");
  if (!isSelf && !isStaff) throw new ForbiddenError("You can't edit this player's profile.");

  // Build the update from the fields this viewer is allowed to touch.
  const editable: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => {
    if (value === undefined) return;
    if (!canEditPlayerField(scope, key)) throw new ForbiddenError(`You can't edit the "${key}" field.`);
    editable[key] = value;
  };

  set("photoUrl", body.photoUrl);
  set("contactPhone", body.contactPhone);
  set("nationality", body.nationality);
  set("heightCm", body.heightCm);
  set("preferredHand", body.preferredHand);
  set("bio", body.bio);
  set("address", body.address);
  set("emergencyContactName", body.emergencyContactName);
  set("emergencyContactPhone", body.emergencyContactPhone);
  set("emergencyContactRelation", body.emergencyContactRelation);
  set("medicalNotes", body.medicalNotes);
  set("welfareNotes", body.welfareNotes);
  if (body.dateOfBirth !== undefined) set("dateOfBirth", body.dateOfBirth ? new Date(body.dateOfBirth) : null);
  if (body.guardianName !== undefined) set("guardianName", body.guardianName);
  if (body.guardianContact !== undefined) set("guardianContact", body.guardianContact);
  // Only an admin flips the public flag (opt-in is captured elsewhere).
  if (body.publicProfileApproved !== undefined && session.user.role === "ADMIN") {
    editable.publicProfileApproved = body.publicProfileApproved;
  }

  const updated = await prisma.playerProfile.update({ where: { id: playerId }, data: editable });
  return ok(updated, { requestId });
});
