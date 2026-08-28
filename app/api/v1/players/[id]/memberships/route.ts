import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth, requirePlayerAccess } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { prisma } from "@/lib/prisma";

/** GET /api/v1/players/:id/memberships — the player's full team history across seasons. */
export const GET = route<{ id: string }>(async (_req, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const playerProfileId = idParam.parse(params.id);

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerProfileId },
    select: { id: true, teamId: true },
  });
  if (!player) return ok([], { requestId });
  requirePlayerAccess(session, player);

  const memberships = await prisma.teamMembership.findMany({
    where: { playerProfileId },
    orderBy: [{ season: { startDate: "desc" } }, { joinedAt: "desc" }],
    include: {
      team: { select: { id: true, name: true } },
      season: { select: { id: true, name: true } },
      squad: { select: { id: true, name: true } },
    },
  });

  return ok(memberships, { requestId });
});
