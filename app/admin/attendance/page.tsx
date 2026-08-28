import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { computeAttendanceStats } from "@/lib/attendance";
import { getActiveSeason } from "@/lib/season";

export default async function AdminAttendancePage() {
  const season = await getActiveSeason();
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      memberships: {
        where: { seasonId: season.id, status: { notIn: ["FORMER", "INACTIVE"] } },
        include: {
          player: {
            include: { attendanceRecords: true, user: { select: { name: true } } },
          },
        },
      },
    },
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Attendance</h1>
      <p className="mt-1 text-slate-600">Attendance % per player, by team (view-only — coaches mark attendance per session).</p>

      <div className="mt-6 space-y-6">
        {teams.map((team) => (
          <section key={team.id} className="rounded-2xl border border-slate-200 bg-surface p-5">
            <Link href={`/admin/teams/${team.id}`} className="font-bold text-slate-900 hover:text-court-700">{team.name}</Link>
            <ul className="mt-3 divide-y divide-slate-100">
              {team.memberships.map((m) => {
                const stats = computeAttendanceStats(m.player.attendanceRecords);
                return (
                  <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium text-slate-800">{m.player.user.name}</span>
                    <span className="text-slate-600">{stats.percentage != null ? `${stats.percentage}%` : "No sessions yet"}</span>
                  </li>
                );
              })}
              {team.memberships.length === 0 && <p className="py-2 text-sm text-slate-500">No players on this team.</p>}
            </ul>
          </section>
        ))}
        {teams.length === 0 && <p className="text-sm text-slate-500">No teams yet.</p>}
      </div>
    </main>
  );
}
