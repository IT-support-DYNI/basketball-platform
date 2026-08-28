import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, noContent } from "@/lib/api";
import { requireRole, requireTeamAccess } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { getActiveSeason } from "@/lib/season";
import { getTenantContext } from "@/lib/tenant";
import { removeFromRoster } from "@/lib/roster";

/**
 * DELETE — remove a player from this team's roster for the active season. The
 * membership becomes FORMER (kept for the historical record), the account is
 * untouched.
 */
export const DELETE = route<{ id: string; playerId: string }>(async (_req, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const ctx = await getTenantContext(session);
  const season = await getActiveSeason(ctx.clubId);

  await removeFromRoster(idParam.parse(params.playerId), teamId, season.id);
  return noContent(requestId);
});
