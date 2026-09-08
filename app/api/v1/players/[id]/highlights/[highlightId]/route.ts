import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, noContent, ForbiddenError, NotFoundError } from "@/lib/api";
import { requireAuth, requirePlayerAccess } from "@/lib/authorization";
import { resolvePlayerViewerScope } from "@/lib/authz/field-visibility";
import { idParam } from "@/lib/contracts/common";
import { playerTeamIds, playerTeamIdsSelect } from "@/lib/roster";
import { prisma } from "@/lib/prisma";

export const DELETE = route<{ id: string; highlightId: string }>(async (_req, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = idParam.parse(params.id);
  const highlightId = idParam.parse(params.highlightId);

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    select: { id: true, userId: true, ...playerTeamIdsSelect },
  });
  if (!player) throw new NotFoundError("That player wasn't found.");

  const teamIds = playerTeamIds(player);
  requirePlayerAccess(session, { id: player.id, teamIds });
  const scope = await resolvePlayerViewerScope(session, { id: player.id, userId: player.userId, teamIds });
  const isSelf = session.user.playerId === playerId || scope.isSelf;
  const isStaff = session.user.role === "ADMIN" || scope.kinds.has("TEAM_COACH");
  if (!isSelf && !isStaff) throw new ForbiddenError("You can't remove this player's highlights.");

  const highlight = await prisma.playerHighlight.findUnique({ where: { id: highlightId } });
  if (!highlight || highlight.playerProfileId !== playerId) throw new NotFoundError("That highlight wasn't found.");

  await prisma.playerHighlight.delete({ where: { id: highlightId } });
  return noContent(requestId);
});
