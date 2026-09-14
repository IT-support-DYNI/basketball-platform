import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, ForbiddenError, NotFoundError } from "@/lib/api";
import { requireAuth, requirePlayerAccess } from "@/lib/authorization";
import { resolvePlayerViewerScope } from "@/lib/authz/field-visibility";
import { idParam } from "@/lib/contracts/common";
import { playerTeamIds, playerTeamIdsSelect } from "@/lib/roster";
import { getPlaybackUrl } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

/**
 * The player's own upload history, so PhotoUpload.tsx can offer "pick one you
 * already uploaded" instead of forcing a fresh upload every time. Same
 * self-or-staff gate as photo-upload-url — this is upload history, not
 * public profile data. Capped at the 12 most recent; each key is resolved to
 * a short-lived signed GET the same way the profile photo itself is.
 */
export const GET = route<{ id: string }>(async (_req, { params, requestId }) => {
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
  if (!isSelf && !isStaff) throw new ForbiddenError("You can't see this player's photos.");

  const rows = await prisma.playerPhoto.findMany({
    where: { playerProfileId: playerId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const photos = (
    await Promise.all(
      rows.map(async (row) => {
        try {
          return { key: row.storageKey, url: await getPlaybackUrl(row.storageKey, 3600) };
        } catch {
          return null;
        }
      })
    )
  ).filter((p): p is { key: string; url: string } => p !== null);

  return ok({ photos }, { requestId });
});
