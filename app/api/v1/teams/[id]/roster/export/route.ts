import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { requireRole, requireTeamAccess } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { getActiveSeason } from "@/lib/season";
import { getTenantContext } from "@/lib/tenant";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/teams/:id/roster/export — the roster as CSV (brief §8: "export
 * roster data"). Admin/coach only; the export is audit-logged.
 */
export const GET = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const ctx = await getTenantContext(session);
  const seasonParam = req.nextUrl.searchParams.get("seasonId");
  const season = seasonParam
    ? await prisma.season.findUnique({ where: { id: Number(seasonParam) } })
    : await getActiveSeason(ctx.clubId);
  if (!season) {
    return NextResponse.json({ error: "season not found" }, { status: 404 });
  }

  const [team, memberships] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
    prisma.teamMembership.findMany({
      where: { teamId, seasonId: season.id },
      orderBy: [{ status: "asc" }, { jerseyNumber: "asc" }],
      include: {
        squad: { select: { name: true } },
        player: { include: { user: { select: { name: true, email: true } } } },
      },
    }),
  ]);

  const rows = [
    ["Name", "Email", "Jersey", "Position", "Secondary", "Squad", "Status", "Joined", "Left"],
    ...memberships.map((m) => [
      m.player.user.name,
      m.player.user.email,
      m.jerseyNumber ?? "",
      m.position ?? "",
      m.secondaryPosition ?? "",
      m.squad?.name ?? "",
      m.status,
      m.joinedAt.toISOString().slice(0, 10),
      m.leftAt ? m.leftAt.toISOString().slice(0, 10) : "",
    ]),
  ];

  await logAudit(prisma, {
    actorUserId: Number(session.user.id),
    action: "ROSTER_EXPORTED",
    entityType: "Team",
    entityId: teamId,
    metadata: { seasonId: season.id, count: memberships.length },
  });

  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const filename = `roster-${slug(team?.name ?? "team")}-${slug(season.name)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});

function csvCell(value: unknown): string {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
