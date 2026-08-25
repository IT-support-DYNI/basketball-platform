import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getCoachDashboard } from "@/lib/dashboard";
import StatTile from "@/components/StatTile";

export default async function CoachDashboardPage() {
  const session = await getServerSession(authOptions);
  const { numberOfPlayers, nextSession, attendanceSummary, recentAnnouncements, recentVideos, playersNeedingReview } =
    await getCoachDashboard(session!);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back, {session?.user?.name} 🏀</h1>
      <p className="mt-1 text-slate-600">Here's what's happening across your team(s).</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile label="Number of Players" value={numberOfPlayers} icon="🧑‍🤝‍🧑" accent="orange" href="/coach/players" />
        <StatTile
          label="Next Training Session"
          value={nextSession ? `${nextSession.title} · ${new Date(nextSession.date).toLocaleDateString()}` : "None scheduled"}
          icon="📅"
          accent="sky"
          href="/coach/training"
        />
        <StatTile
          label="Attendance Summary"
          value={attendanceSummary.percentage != null ? `${attendanceSummary.percentage}%` : "No data yet"}
          icon="✅"
          accent="emerald"
          href="/coach/attendance"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Recent Announcements</h2>
          {recentAnnouncements.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing posted yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recentAnnouncements.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-semibold text-slate-800">{a.title}</p>
                  <p className="text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Recently Added Videos</h2>
          {recentVideos.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">You haven't uploaded any videos yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentVideos.map((v) => (
                <li key={v.id} className="text-sm font-medium text-slate-800">{v.title}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Players Requiring Performance Review</h2>
        <p className="mt-1 text-xs text-slate-500">No evaluation recorded in the last 30 days.</p>
        {playersNeedingReview.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-700">Everyone's up to date 🎉</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {playersNeedingReview.map((p) => (
              <Link key={p.id} href="/coach/performance" className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 hover:bg-amber-100">
                {p.name}
              </Link>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/coach/training" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Create Training</Link>
          <Link href="/coach/attendance" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Mark Attendance</Link>
          <Link href="/coach/players" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Add Player</Link>
          <Link href="/coach/videos" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Upload Video</Link>
          <Link href="/coach/performance" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Record Performance</Link>
          <Link href="/coach/announcements" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Send Announcement</Link>
        </div>
      </section>
    </main>
  );
}
