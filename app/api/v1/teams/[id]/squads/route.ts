import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created, ConflictError } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { createSquadSchema } from "@/lib/contracts/organisation";
import { getActiveSeason } from "@/lib/season";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

/** GET — a team's squads for a season (active by default). */
export const GET = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const ctx = await getTenantContext(session);
  const seasonParam = req.nextUrl.searchParams.get("seasonId");
  const seasonId = seasonParam ? Number(seasonParam) : (await getActiveSeason(ctx.clubId)).id;

  const squads = await prisma.squad.findMany({
    where: { teamId, seasonId },
    orderBy: { name: "asc" },
    include: { _count: { select: { memberships: true } } },
  });
  return ok({ teamId, seasonId, squads }, { requestId });
});

/** POST — create a squad within a team for a season (admin). */
export const POST = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const ctx = await getTenantContext(session);
  const body = createSquadSchema.parse(await req.json());
  const seasonId = body.seasonId ?? (await getActiveSeason(ctx.clubId)).id;

  if (await prisma.squad.findFirst({ where: { teamId, seasonId, name: body.name } })) {
    throw new ConflictError("This team already has a squad with that name for the season.");
  }

  const squad = await prisma.squad.create({
    data: { teamId, seasonId, name: body.name, ageGroup: body.ageGroup },
  });
  return created(squad, requestId);
});
