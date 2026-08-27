import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAttendanceStats } from "@/lib/attendance";

export default async function CoachAttendancePage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const [players, recentSessions] = await Promise.all([
    prisma.playerProfile.findMany({
      where: { teamId: { in: teamIds } },
      include: { user: { select: { name: true } }, attendanceRecords: true, team: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.trainingSession.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { date: "desc" },
      take: 10,
      include: { team: { select: { name: true } } },
    }),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Attendance</h1>
      <p className="mt-1 text-slate-600">Per-player attendance % across your team(s). Mark attendance from a specific session.</p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-bold text-slate-900">By Player</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {players.map((p) => {
            const stats = computeAttendanceStats(p.attendanceRecords);
            return (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="font-medium text-slate-800">{p.user.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{p.team?.name}</span>
                </div>
                <span className="text-slate-600">{stats.percentage != null ? `${stats.percentage}%` : "No sessions yet"}</span>
              </li>
            );
          })}
          {players.length === 0 && <p className="py-2 text-sm text-slate-500">No players yet.</p>}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-bold text-slate-900">Recent Sessions</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {recentSessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium text-slate-800">{s.title} · {s.team.name} · {new Date(s.date).toLocaleDateString()}</span>
              <Link href={`/coach/training/${s.id}`} className="text-xs font-semibold text-court-700 hover:text-court-800">Mark attendance →</Link>
            </li>
          ))}
          {recentSessions.length === 0 && <p className="py-2 text-sm text-slate-500">No sessions yet.</p>}
        </ul>
      </section>
    </main>
  );
}
