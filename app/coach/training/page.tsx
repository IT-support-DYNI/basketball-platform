import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import CreateSessionForm from "@/components/coach/CreateSessionForm";

export default async function CoachTrainingPage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const [teams, sessions] = await Promise.all([
    prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } }),
    prisma.trainingSession.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { date: "desc" },
      include: { team: { select: { name: true } } },
    }),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Training</h1>
      <p className="mt-1 text-slate-600">Create, edit, and cancel sessions for your team(s).</p>

      <div className="mt-6">
        <CreateSessionForm teams={teams} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{s.team.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.title}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(s.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-600">{s.startTime}–{s.endTime}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/coach/training/${s.id}`} className="text-xs font-semibold text-court-700 hover:text-court-800">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No sessions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
