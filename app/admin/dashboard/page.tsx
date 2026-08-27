import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/dashboard";
import StatTile from "@/components/StatTile";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">{children}</h2>;
}

const quickLink =
  "rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm font-semibold text-ink-dim transition hover:border-line-strong hover:text-ink";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const { stats, activeTeams, recentAnnouncements } = await getAdminDashboard();

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administrator"
        title="Club overview"
        lead={`Welcome back, ${session?.user?.name?.split(" ")[0] ?? ""}. Everything happening across the club.`}
      />

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Members" value={stats.totalUsers} accent="info" href="/admin/users" />
        <StatTile label="Teams" value={stats.totalTeams} accent="flame" href="/admin/teams" />
        <StatTile label="Coaches" value={stats.totalCoaches} accent="ember" href="/admin/coaches" />
        <StatTile label="Players" value={stats.totalPlayers} accent="success" href="/admin/players" />
        <StatTile label="Pending" value={stats.pendingRegistrations} accent="warning" href="/admin/registrations" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card as="section">
          <div className="flex items-center justify-between">
            <SectionTitle>Active teams</SectionTitle>
            <Link href="/admin/teams" className="text-sm font-semibold text-flame-ink hover:underline">
              Manage →
            </Link>
          </div>
          {activeTeams.length === 0 ? (
            <p className="mt-3 text-sm text-ink-dim">No teams yet — create the first one.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {activeTeams.map((team) => (
                <li key={team.id} className="flex items-center justify-between py-2.5">
                  <Link href={`/admin/teams/${team.id}`} className="font-medium text-ink hover:text-flame-ink">
                    {team.name}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-faint">{team._count.players} players</span>
                    <StatusBadge status={team.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section">
          <SectionTitle>Recent announcements</SectionTitle>
          {recentAnnouncements.length === 0 ? (
            <p className="mt-3 text-sm text-ink-dim">Nothing posted yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recentAnnouncements.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-semibold text-ink">{a.title}</p>
                  <p className="text-ink-faint">
                    by {a.author.name} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card as="section">
        <SectionTitle>Quick links</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/teams" className={quickLink}>+ Create team</Link>
          <Link href="/admin/users" className={quickLink}>+ Add coach</Link>
          <Link href="/admin/settings" className={quickLink}>Club settings</Link>
        </div>
      </Card>
    </main>
  );
}
