import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getPlayerDashboard } from "@/lib/dashboard";
import StatTile from "@/components/StatTile";

export default async function PlayerDashboardPage() {
  const session = await getServerSession(authOptions);
  const { nextSession, attendance, weeklyEvaluation, monthlyEvaluation, monthlyTrend, latestVideo, latestFeedback, notifications } =
    await getPlayerDashboard(session!);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back, {session?.user?.name} 🏀</h1>
      <p className="mt-1 text-slate-600">Here's your training and development at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Next Training"
          value={nextSession ? `${new Date(nextSession.date).toLocaleDateString()} · ${nextSession.startTime}–${nextSession.endTime}` : "None scheduled"}
          icon="📅"
          accent="sky"
          href="/player/training"
        />
        <StatTile
          label="Attendance"
          value={attendance?.percentage != null ? `${attendance.percentage}%` : "No data yet"}
          icon="✅"
          accent="emerald"
          href="/player/attendance"
        />
        <StatTile
          label="Weekly Performance"
          value={weeklyEvaluation ? `${weeklyEvaluation.overallScore} / 10` : "Not scored yet"}
          icon="📈"
          accent="orange"
          href="/player/performance"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Monthly Performance</h2>
          {monthlyEvaluation ? (
            <>
              <p className="mt-2 text-3xl font-extrabold text-court-700">{Number(monthlyEvaluation.overallScore)} / 10</p>
              {monthlyTrend.length > 1 && (
                <div className="mt-3 flex items-end gap-1.5" style={{ height: 60 }}>
                  {monthlyTrend.map((m, i) => (
                    <div
                      key={i}
                      title={`${Number(m.overallScore)}/10`}
                      className="w-6 rounded-t bg-court-400"
                      style={{ height: `${(Number(m.overallScore) / 10) * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No monthly evaluation yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">New Training Video</h2>
          {latestVideo ? (
            <>
              <p className="mt-2 font-semibold text-slate-800">{latestVideo.title}</p>
              <p className="text-sm text-slate-500">{latestVideo.category.replace(/_/g, " ")}</p>
              <Link href="/player/videos" className="mt-3 inline-block text-sm font-semibold text-court-700 hover:text-court-800">Watch now →</Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No videos assigned yet.</p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Coach Feedback</h2>
        {latestFeedback ? (
          <>
            <p className="mt-2 italic text-slate-700">"{latestFeedback.message}"</p>
            <p className="mt-1 text-xs text-slate-400">— {latestFeedback.coach.user.name}</p>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No feedback yet.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent Notifications</h2>
          <Link href="/player/notifications" className="text-sm font-semibold text-court-700 hover:text-court-800">View all →</Link>
        </div>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nothing yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.id} className={`py-2 text-sm ${n.isRead ? "text-slate-500" : "font-medium text-slate-900"}`}>
                {n.title}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
