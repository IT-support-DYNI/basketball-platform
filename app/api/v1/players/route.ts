import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { getActiveSeason } from "@/lib/season";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/players — approved players, with their current active membership.
 * `?notOnTeam=<id>` filters to players not on that team's active-season roster
 * (the picker for "add existing player").
 */
export const GET = route(async (req: NextRequest, { requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const ctx = await getTenantContext(session);
  const season = await getActiveSeason(ctx.clubId);

  const notOnTeam = req.nextUrl.searchParams.get("notOnTeam");

  const players = await prisma.playerProfile.findMany({
    where: {
      registrationStatus: "APPROVED",
      ...(notOnTeam
        ? {
            NOT: {
              memberships: {
                some: {
                  teamId: Number(notOnTeam),
                  seasonId: season.id,
                  status: { notIn: ["FORMER"] },
                },
              },
            },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      memberships: {
        where: { seasonId: season.id, status: { notIn: ["FORMER"] } },
        include: { team: { select: { id: true, name: true } } },
        take: 1,
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return ok(
    players.map((p) => ({
      id: p.id,
      user: p.user,
      currentTeam: p.memberships[0]?.team ?? null,
      currentJersey: p.memberships[0]?.jerseyNumber ?? null,
    })),
    { requestId },
  );
});
