import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/authorization";
import { createTeamSchema } from "@/lib/contracts/team";
import { getTenantContext, teamClubScope } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

/**
 * Reference implementation for the /api/v1 conventions: `route()` wrapper,
 * `getTenantContext` for club scoping, `ok` / `created` response helpers,
 * contracts for validation.
 *
 * Admin: every team in their club. Coach: teams they're assigned to.
 * Player: their own team.
 */
export const GET = route(async (_req, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const ctx = await getTenantContext(session);

  if (session.user.role === "ADMIN") {
    const teams = await prisma.team.findMany({
      where: teamClubScope(ctx),
      orderBy: { name: "asc" },
      include: { _count: { select: { memberships: { where: { status: { notIn: ["FORMER"] } } }, staffAssignments: true } } },
    });
    return ok(teams, { requestId });
  }

  if (session.user.role === "COACH") {
    const teams = await prisma.team.findMany({
      where: {
        AND: [teamClubScope(ctx), { id: { in: session.user.teamIds ?? [] } }],
      },
      orderBy: { name: "asc" },
      include: { _count: { select: { memberships: { where: { status: { notIn: ["FORMER"] } } } } } },
    });
    return ok(teams, { requestId });
  }

  // PLAYER
  if (!session.user.teamId) return ok([], { requestId });
  const team = await prisma.team.findFirst({
    where: { AND: [{ id: session.user.teamId }, teamClubScope(ctx)] },
  });
  return ok(team ? [team] : [], { requestId });
});

export const POST = route(async (req: NextRequest, { requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const ctx = await getTenantContext(session);
  const body = createTeamSchema.parse(await req.json());

  const team = await prisma.team.create({ data: { ...body, clubId: ctx.clubId } });
  return created(team, requestId);
});
