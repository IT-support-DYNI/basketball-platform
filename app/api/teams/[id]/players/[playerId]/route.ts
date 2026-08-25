import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireRole, requireTeamAccess } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/** Removes a player from the roster — unassigns their team (teamId → null); does not delete the account. */
export const DELETE = withApi<{ params: { id: string; playerId: string } }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const teamId = Number(params.id);
  requireTeamAccess(session, teamId);

  const player = await prisma.playerProfile.findUnique({ where: { id: Number(params.playerId) } });
  if (!player || player.teamId !== teamId) {
    return NextResponse.json({ error: "Not found on this team" }, { status: 404 });
  }

  await prisma.playerProfile.update({ where: { id: player.id }, data: { teamId: null } });
  return NextResponse.json({ ok: true });
});
