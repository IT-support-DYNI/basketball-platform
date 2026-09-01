import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/** GET — people the caller can start a conversation with: everyone on a team
 *  they share (players + staff). */
export const GET = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));
  const me = Number(session.user.id);

  const teamIds =
    session.user.role === "COACH"
      ? (session.user.teamIds ?? [])
      : session.user.role === "PLAYER" && session.user.teamId != null
        ? [session.user.teamId]
        : [];
  if (teamIds.length === 0) return ok([]);

  const [players, staff] = await Promise.all([
    prisma.teamMembership.findMany({
      where: { teamId: { in: teamIds }, status: { notIn: ["FORMER", "INACTIVE"] } },
      select: { player: { select: { user: { select: { id: true, name: true } } } } },
    }),
    prisma.staffAssignment.findMany({
      where: { teamId: { in: teamIds } },
      select: { user: { select: { id: true, name: true } }, role: true },
    }),
  ]);

  const byId = new Map<number, { id: number; name: string; role: string }>();
  for (const p of players) byId.set(p.player.user.id, { id: p.player.user.id, name: p.player.user.name, role: "Player" });
  for (const s of staff) byId.set(s.user.id, { id: s.user.id, name: s.user.name, role: "Staff" });
  byId.delete(me);

  return ok([...byId.values()].sort((a, b) => a.name.localeCompare(b.name)));
});
