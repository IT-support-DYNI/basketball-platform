import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/authorization";
import { createTeamSchema } from "@/lib/validation/team";
import { prisma } from "@/lib/prisma";

/** Admin: every team. Coach: teams they're assigned to. Player: their own team. */
export const GET = withApi(async () => {
  const session = requireAuth(await getServerSession(authOptions));

  if (session.user.role === "ADMIN") {
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { players: true, coaches: true } } },
    });
    return NextResponse.json(teams);
  }

  if (session.user.role === "COACH") {
    const teams = await prisma.team.findMany({
      where: { coaches: { some: { coachProfileId: session.user.coachProfileId } } },
      orderBy: { name: "asc" },
      include: { _count: { select: { players: true } } },
    });
    return NextResponse.json(teams);
  }

  // PLAYER
  if (!session.user.teamId) return NextResponse.json([]);
  const team = await prisma.team.findUnique({ where: { id: session.user.teamId } });
  return NextResponse.json(team ? [team] : []);
});

export const POST = withApi(async (req: NextRequest) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = createTeamSchema.parse(await req.json());
  const team = await prisma.team.create({ data: body });
  return NextResponse.json(team, { status: 201 });
});
