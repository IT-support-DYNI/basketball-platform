import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getCoachDashboard } from "@/lib/dashboard";
import { actionItemsFor } from "@/lib/action-items";
import { eventDayLabel } from "@/lib/events";
import StatTile from "@/components/StatTile";
import ActionItems from "@/components/dashboard/ActionItems";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">{children}</h2>;
}

const quickLink =
  "rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm font-semibold text-ink-dim transition hover:border-line-strong hover:text-ink";

export default async function CoachDashboardPage() {
  const session = await getServerSession(authOptions);
  const [
    { numberOfPlayers, nextSession, attendanceSummary, recentAnnouncements, recentVideos, playersNeedingReview },
    actionItems,
  ] = await Promise.all([getCoachDashboard(session!), actionItemsFor(session!)]);

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Coach"
        title={`Welcome back, ${session?.user?.name?.split(" ")[0] ?? "coach"}`}
        lead="What's happening across your team."
      />

      <ActionItems items={actionItems} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Players" value={numberOfPlayers} accent="flame" href="/coach/players" />
        <StatTile
          label="Next session"
          value={nextSession ? nextSession.title : "None scheduled"}
          sub={nextSession ? eventDayLabel(nextSession.startAt) : undefined}
          accent="info"
          href="/coach/training"
        />
        <StatTile
          label="Team attendance"
          value={attendanceSummary.percentage != null ? `${attendanceSummary.percentage}%` : "—"}
          sub={attendanceSummary.percentage != null ? "this season" : "no data yet"}
          accent="success"
          href="/coach/attendance"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card as="section">
          <SectionTitle>Recent announcements</SectionTitle>
          {recentAnnouncements.length === 0 ? (
            <p className="mt-3 text-sm text-ink-dim">Nothing posted yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recentAnnouncements.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-semibold text-ink">{a.title}</p>
                  <p className="text-ink-faint">{new Date(a.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section">
          <SectionTitle>Recently added videos</SectionTitle>
          {recentVideos.length === 0 ? (
            <p className="mt-3 text-sm text-ink-dim">You haven't uploaded any videos yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentVideos.map((v) => (
                <li key={v.id} className="text-sm font-medium text-ink">{v.title}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card as="section">
        <SectionTitle>Players requiring a performance review</SectionTitle>
        <p className="mt-1 text-xs text-ink-faint">No evaluation recorded in the last 30 days.</p>
        {playersNeedingReview.length === 0 ? (
          <p className="mt-3 text-sm text-success">Everyone's up to date.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {playersNeedingReview.map((p) => (
              <li key={p.id}>
                <Link
                  href="/coach/performance"
                  className="block rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-sm font-semibold text-warning hover:bg-warning/20"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card as="section">
        <SectionTitle>Quick actions</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/coach/training" className={quickLink}>Create training</Link>
          <Link href="/coach/attendance" className={quickLink}>Mark attendance</Link>
          <Link href="/coach/players" className={quickLink}>Add player</Link>
          <Link href="/coach/videos" className={quickLink}>Upload video</Link>
          <Link href="/coach/performance" className={quickLink}>Record performance</Link>
          <Link href="/coach/announcements" className={quickLink}>Send announcement</Link>
        </div>
      </Card>
    </main>
  );
}
