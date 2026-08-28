import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, NotFoundError } from "@/lib/api";
import { requireAuth, requireAbility } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { updateMembershipSchema } from "@/lib/contracts/organisation";
import { updateMembership } from "@/lib/roster";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/v1/memberships/:id — change a player's jersey number, position,
 * squad or status for a season. Jersey clashes with another active player
 * return 409.
 */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const membershipId = idParam.parse(params.id);

  const membership = await prisma.teamMembership.findUnique({
    where: { id: membershipId },
    select: { teamId: true },
  });
  if (!membership) throw new NotFoundError("That membership wasn't found.");

  requireAbility(session, "update", "PlayerProfile", { teamId: membership.teamId });

  const body = updateMembershipSchema.parse(await req.json());
  const updated = await updateMembership(membershipId, body);
  return ok(updated, { requestId });
});
