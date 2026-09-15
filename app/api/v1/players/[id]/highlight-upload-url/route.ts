import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ForbiddenError, NotFoundError } from "@/lib/api";
import { requireAuth, requirePlayerAccess } from "@/lib/authorization";
import { resolvePlayerViewerScope } from "@/lib/authz/field-visibility";
import { idParam } from "@/lib/contracts/common";
import { requestUploadSchema } from "@/lib/contracts/video";
import { playerTeamIds, playerTeamIdsSelect } from "@/lib/roster";
import { createPresignedUpload } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

/**
 * Step 1 of a player uploading a highlight clip directly (instead of linking
 * one already hosted elsewhere): a short-lived PUT URL, upload straight to
 * storage, then POST /api/v1/players/:id/highlights with { title, storageKey
 * }. Same two-step shape and same self-or-staff gate as photo-upload-url.
 */
export const POST = route<{ id: string }>(async (req: NextRequest, { params }) => {
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

  const body = requestUploadSchema.parse(await req.json());
  if (!body.contentType.startsWith("video/")) {
    throw new ForbiddenError("A highlight clip has to be a video file.");
  }

  const upload = await createPresignedUpload("highlight-videos", body.contentType);
  return NextResponse.json(upload);
});
