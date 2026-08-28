import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, noContent, NotFoundError } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess } from "@/lib/authorization";
import { updateTeamSchema } from "@/lib/contracts/team";
import { idParam } from "@/lib/contracts/common";
import { getTenantContext, assertSameClub } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params, requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      coaches: { include: { coach: { include: { user: { select: { id: true, name: true, email: true } } } } } },
      _count: { select: { players: true } },
    },
  });

  if (!team) throw new NotFoundError("That team wasn't found.");
  assertSameClub(team.clubId, await getTenantContext(session));
  return ok(team, { requestId });
});

export const PATCH = route<{ id: string }>(async (req: NextRequest, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const teamId = idParam.parse(params.id);
  const ctx = await getTenantContext(session);

  const existing = await prisma.team.findUnique({ where: { id: teamId }, select: { clubId: true } });
  if (!existing) throw new NotFoundError("That team wasn't found.");
  assertSameClub(existing.clubId, ctx);

  const body = updateTeamSchema.parse(await req.json());
  const team = await prisma.team.update({ where: { id: teamId }, data: body });
  return ok(team, { requestId });
});

export const DELETE = route<{ id: string }>(async (_req, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const teamId = idParam.parse(params.id);
  const ctx = await getTenantContext(session);

  const existing = await prisma.team.findUnique({ where: { id: teamId }, select: { clubId: true } });
  if (!existing) throw new NotFoundError("That team wasn't found.");
  assertSameClub(existing.clubId, ctx);

  await prisma.team.delete({ where: { id: teamId } });
  return noContent(requestId);
});
