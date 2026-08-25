import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/dashboard";
import StatTile from "@/components/StatTile";
import StatusBadge from "@/components/StatusBadge";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const { stats, activeTeams, recentAnnouncements } = await getAdminDashboard();

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Admin Overview
      </h1>
      <p className="mt-1 text-slate-600">
        Welcome back, {session?.user?.name}. Here's everything going on across the platform.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatTile label="Total Users" value={stats.totalUsers} icon="👥" accent="violet" href="/admin/users" />
        <StatTile label="Total Teams" value={stats.totalTeams} icon="🗂️" accent="orange" href="/admin/teams" />
        <StatTile label="Total Coaches" value={stats.totalCoaches} icon="🎯" accent="sky" href="/admin/coaches" />
        <StatTile label="Total Players" value={stats.totalPlayers} icon="🏀" accent="emerald" href="/admin/players" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Active Teams</h2>
            <Link href="/admin/teams" className="text-sm font-semibold text-court-700 hover:text-court-800">
              Manage →
            </Link>
          </div>

          {activeTeams.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No teams yet — create the first one.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {activeTeams.map((team) => (
                <li key={team.id} className="flex items-center justify-between py-2.5">
                  <Link href={`/admin/teams/${team.id}`} className="font-medium text-slate-800 hover:text-court-700">
                    {team.name}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{team._count.players} players</span>
                    <StatusBadge status={team.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Recent Announcements</h2>
          {recentAnnouncements.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing posted yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recentAnnouncements.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-semibold text-slate-800">{a.title}</p>
                  <p className="text-slate-500">by {a.author.name} · {new Date(a.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Quick Links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/teams" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            + Create Team
          </Link>
          <Link href="/admin/users" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            + Add Coach
          </Link>
          <Link href="/admin/settings" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            Platform Settings
          </Link>
        </div>
      </section>
    </main>
  );
}
