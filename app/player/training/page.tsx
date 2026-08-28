import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

/** Read-only for Player, per the PRD permission matrix. */
export default async function PlayerTrainingPage() {
  const session = await getServerSession(authOptions);
  const teamId = session!.user.teamId;

  const sessions = teamId
    ? await prisma.trainingSession.findMany({
        where: { teamId },
        orderBy: { date: "desc" },
      })
    : [];

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Training</h1>
      <p className="mt-1 text-slate-600">Your team's schedule — upcoming and past sessions.</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-surface">
        <table className="w-full min-w-[38rem] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{s.title}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(s.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-600">{s.startTime}–{s.endTime}</td>
                <td className="px-4 py-3 text-slate-600">{s.location}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No sessions scheduled yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
