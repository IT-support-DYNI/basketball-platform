import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAttendanceStats } from "@/lib/attendance";
import StatTile from "@/components/StatTile";
import StatusBadge from "@/components/StatusBadge";

export default async function PlayerAttendancePage() {
  const session = await getServerSession(authOptions);
  const playerId = session!.user.playerId;

  const records = playerId
    ? await prisma.attendanceRecord.findMany({
        where: { playerId },
        include: { session: { select: { title: true, date: true } } },
        orderBy: { session: { date: "desc" } },
      })
    : [];

  const stats = computeAttendanceStats(records);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Attendance</h1>
      <p className="mt-1 text-slate-600">Your attendance history and overall percentage.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatTile label="Attendance %" value={stats.percentage != null ? `${stats.percentage}%` : "—"} icon="✅" accent="emerald" />
        <StatTile label="Present" value={stats.present} icon="🟢" accent="orange" />
        <StatTile label="Late" value={stats.late} icon="🟡" accent="amber" />
        <StatTile label="Absent" value={stats.absent} icon="🔴" accent="rose" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{r.session.title}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(r.session.date).toLocaleDateString()}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">No attendance recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
