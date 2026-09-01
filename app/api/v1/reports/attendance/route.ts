import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { BadRequestError, ForbiddenError } from "@/lib/api/errors";
import { requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { computeAttendanceStats } from "@/lib/attendance";
import { rosterPlayerFilter } from "@/lib/roster";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/reports/attendance?teamId=&from=&to=&format=csv
 * Per-player attendance over a window. Coach for their own team, admin for any.
 */
export const GET = route(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const sp = req.nextUrl.searchParams;

  const teamId = Number(sp.get("teamId"));
  if (!teamId) throw new BadRequestError("A teamId is required.");
  if (authorize(session).cannot("record", "Attendance", { teamId })) {
    throw new ForbiddenError("You don't have access to that team.");
  }

  const now = Date.now();
  const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(now - 90 * 864e5);
  // Default the upper bound to end-of-day so an event later today is included.
  const to = sp.get("to") ? new Date(sp.get("to")!) : new Date(now + 864e5);

  const [players, events] = await Promise.all([
    prisma.playerProfile.findMany({
      where: rosterPlayerFilter(teamId),
      select: {
        id: true,
        user: { select: { name: true } },
        attendanceRecords: {
          where: { event: { teamId, startAt: { gte: from, lte: to } } },
          select: { status: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.event.count({ where: { teamId, startAt: { gte: from, lte: to }, status: { not: "CANCELLED" } } }),
  ]);

  const rows = players.map((p) => {
    const s = computeAttendanceStats(p.attendanceRecords);
    return {
      playerId: p.id,
      name: p.user.name,
      present: s.present,
      late: s.late,
      absent: s.absent,
      excused: s.excused,
      recorded: p.attendanceRecords.length,
      percentage: s.percentage,
    };
  });

  if (sp.get("format") === "csv") {
    const header = "Player,Present,Late,Absent,Excused,Recorded,Attendance %";
    const body = rows
      .map((r) => `${csv(r.name)},${r.present},${r.late},${r.absent},${r.excused},${r.recorded},${r.percentage ?? ""}`)
      .join("\n");
    return new NextResponse(`${header}\n${body}\n`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-team-${teamId}.csv"`,
      },
    });
  }

  return ok({
    teamId,
    from: from.toISOString(),
    to: to.toISOString(),
    events,
    players: rows,
  });
});

function csv(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
