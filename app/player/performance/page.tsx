import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatTile from "@/components/StatTile";

export default async function PlayerPerformancePage() {
  const session = await getServerSession(authOptions);
  const playerId = session!.user.playerId;

  const evaluations = playerId
    ? await prisma.performanceEvaluation.findMany({
        where: { playerId },
        include: { categoryScores: true },
        orderBy: { periodStart: "desc" },
      })
    : [];

  const latestWeekly = evaluations.find((e) => e.periodType === "WEEKLY");
  const latestMonthly = evaluations.find((e) => e.periodType === "MONTHLY");
  const monthlyTrend = evaluations
    .filter((e) => e.periodType === "MONTHLY")
    .slice()
    .reverse();

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Performance</h1>
      <p className="mt-1 text-slate-600">Your evaluation history and development over time.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatTile label="Latest Weekly Score" value={latestWeekly ? `${latestWeekly.overallScore} / 10` : "—"} icon="📅" accent="sky" />
        <StatTile label="Latest Monthly Score" value={latestMonthly ? `${latestMonthly.overallScore} / 10` : "—"} icon="📈" accent="orange" />
      </div>

      {monthlyTrend.length > 1 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
          <h2 className="font-bold text-slate-900">Monthly trend</h2>
          <div className="mt-4 flex items-end gap-3" style={{ height: 100 }}>
            {monthlyTrend.map((m) => (
              <div key={m.id} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-court-400" style={{ height: `${(Number(m.overallScore) / 10) * 100}%` }} />
                <span className="text-[10px] text-slate-500">{new Date(m.periodStart).toLocaleDateString(undefined, { month: "short" })}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 space-y-4">
        {evaluations.map((e) => (
          <div key={e.id} className="rounded-2xl border border-slate-200 bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900">
                {e.periodType} · {new Date(e.periodStart).toLocaleDateString()} – {new Date(e.periodEnd).toLocaleDateString()}
              </p>
              <span className="text-xl font-extrabold text-court-700">{Number(e.overallScore)}/10</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {e.categoryScores.map((c) => (
                <span key={c.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {c.category.replace(/_/g, " ")}: {c.score}
                </span>
              ))}
            </div>
            {(e.strengths || e.developmentAreas) && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {e.strengths && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">Strengths</p>
                    <p className="text-sm text-slate-600">{e.strengths}</p>
                  </div>
                )}
                {e.developmentAreas && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700">Development areas</p>
                    <p className="text-sm text-slate-600">{e.developmentAreas}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {evaluations.length === 0 && <p className="text-sm text-slate-500">No evaluations recorded yet.</p>}
      </section>
    </main>
  );
}
