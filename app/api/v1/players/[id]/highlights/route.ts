import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created, ForbiddenError, NotFoundError } from "@/lib/api";
import { requireAuth, requirePlayerAccess } from "@/lib/authorization";
import { resolvePlayerViewerScope } from "@/lib/authz/field-visibility";
import { idParam } from "@/lib/contracts/common";
import { createHighlightSchema } from "@/lib/contracts/team";
import { playerTeamIds, playerTeamIdsSelect } from "@/lib/roster";
import { prisma } from "@/lib/prisma";

/** A player's highlight-reel links — same visibility rule as bio/photoUrl:
 *  club-visible always, public only once publicProfileApproved. */
export const GET = route<{ id: string }>(async (_req, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = idParam.parse(params.id);

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    select: { publicProfileApproved: true, ...playerTeamIdsSelect },
  });
  if (!player) throw new NotFoundError("That player wasn't found.");

  const teamIds = playerTeamIds(player);
  const scope = await resolvePlayerViewerScope(session, { id: playerId, teamIds });
  const canSee = scope.kinds.has("PUBLIC") ? player.publicProfileApproved : true;
  if (!canSee) throw new ForbiddenError("This player's highlights aren't public.");

  const highlights = await prisma.playerHighlight.findMany({
    where: { playerProfileId: playerId },
    orderBy: { createdAt: "desc" },
  });
  return ok(highlights, { requestId });
});

export const POST = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerId = idParam.parse(params.id);

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
  if (!isSelf && !isStaff) throw new ForbiddenError("You can't add highlights for this player.");

  const body = createHighlightSchema.parse(await req.json());
  const highlight = await prisma.playerHighlight.create({
    data: { playerProfileId: playerId, title: body.title, url: body.url },
  });
  return created(highlight, requestId);
});
