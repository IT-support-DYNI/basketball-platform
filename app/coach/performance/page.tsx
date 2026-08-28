import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RecordEvaluationForm from "@/components/coach/RecordEvaluationForm";
import { rosterPlayerFilter } from "@/lib/roster";
import WriteFeedbackForm from "@/components/coach/WriteFeedbackForm";

export default async function CoachPerformancePage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const players = await prisma.playerProfile.findMany({
    where: rosterPlayerFilter(teamIds),
    include: { user: { select: { name: true } }, evaluations: { orderBy: { periodStart: "desc" }, take: 1 } },
    orderBy: { user: { name: "asc" } },
  });

  const options = players.map((p) => ({ id: p.id, name: p.user.name }));

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Performance</h1>
      <p className="mt-1 text-slate-600">Record weekly and monthly evaluations, and write feedback for your players.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <RecordEvaluationForm players={options} />
        <WriteFeedbackForm players={options} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-surface">
        <table className="w-full min-w-[38rem] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Latest Evaluation</th>
              <th className="px-4 py-3">Overall Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{p.user.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {p.evaluations[0] ? `${p.evaluations[0].periodType} · ${new Date(p.evaluations[0].periodStart).toLocaleDateString()}` : "None yet"}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.evaluations[0] ? Number(p.evaluations[0].overallScore) : "—"}</td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">No players yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
