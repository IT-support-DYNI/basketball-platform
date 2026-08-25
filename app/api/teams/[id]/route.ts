import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess } from "@/lib/authorization";
import { updateTeamSchema } from "@/lib/validation/team";
import { prisma } from "@/lib/prisma";

export const GET = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const teamId = Number(params.id);
  requireTeamAccess(session, teamId);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      coaches: { include: { coach: { include: { user: { select: { id: true, name: true, email: true } } } } } },
      _count: { select: { players: true } },
    },
  });

  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(team);
});

export const PATCH = withApi<{ params: { id: string } }>(async (req, { params }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = updateTeamSchema.parse(await req.json());
  const team = await prisma.team.update({ where: { id: Number(params.id) }, data: body });
  return NextResponse.json(team);
});

export const DELETE = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  await prisma.team.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
});
