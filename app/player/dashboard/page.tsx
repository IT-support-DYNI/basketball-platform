import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getPlayerDashboard } from "@/lib/dashboard";
import { actionItemsFor } from "@/lib/action-items";
import { eventDayLabel, eventTimeRange } from "@/lib/events";
import StatTile from "@/components/StatTile";
import ActionItems from "@/components/dashboard/ActionItems";
import ProgressBar from "@/components/dashboard/ProgressBar";
import Sparkline from "@/components/dashboard/Sparkline";
import CountUp from "@/components/player/CountUp";
import ScrollReveal from "@/components/player/ScrollReveal";
import DashboardHero from "@/components/dashboard/DashboardHero";
import Card from "@/components/ui/Card";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">{children}</h2>;
}

export default async function PlayerDashboardPage() {
  const session = await getServerSession(authOptions);
  const [
    { nextSession, attendance, weeklyEvaluation, monthlyEvaluation, monthlyTrend, latestVideo, latestFeedback, notifications },
    actionItems,
  ] = await Promise.all([getPlayerDashboard(session!), actionItemsFor(session!)]);

  const trendValues = monthlyTrend.map((m) => Number(m.overallScore));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const facts: string[] = [];
  if (attendance?.percentage != null) facts.push(`${attendance.percentage}% attendance this season`);
  if (nextSession) facts.push(`Next training ${eventDayLabel(nextSession.startAt)}`);
  if (weeklyEvaluation) facts.push(`Weekly form ${weeklyEvaluation.overallScore}/10`);
  if (unreadCount > 0) facts.push(`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`);

  return (
    <main className="flex flex-col gap-8">
      <DashboardHero
        eyebrow="Player"
        greeting="Welcome back,"
        name={session?.user?.name?.split(" ")[0] ?? "player"}
        lead="Your training and development at a glance."
        facts={facts}
      />

      <div className="animate-stagger-rise" style={{ animationDelay: "60ms" }}>
        <ActionItems items={actionItems} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Next Training — orange, the "what's coming up" card */}
        <div className="animate-stagger-rise" style={{ animationDelay: "100ms" }}>
          <StatTile
            label="Next training"
            value={nextSession ? eventDayLabel(nextSession.startAt) : "None scheduled"}
            sub={nextSession ? eventTimeRange(nextSession.startAt, nextSession.endAt) : undefined}
            accent="flame"
            href="/player/training"
          />
        </div>

        {/* Attendance — green, with a real animated progress bar underneath */}
        <div className="animate-stagger-rise" style={{ animationDelay: "180ms" }}>
          <StatTile
            label="Attendance"
            value={
              attendance?.percentage != null ? (
                <CountUp value={attendance.percentage} suffix="%" />
              ) : (
                "—"
              )
            }
            sub={
              attendance?.percentage != null ? (
                <>
                  <span>this season</span>
                  <ProgressBar pct={attendance.percentage} colorClass="bg-success" />
                </>
              ) : (
                "no data yet"
              )
            }
            accent="success"
            href="/player/attendance"
          />
        </div>

        {/* Weekly form — blue, with a self-drawing trend line */}
        <div className="animate-stagger-rise" style={{ animationDelay: "260ms" }}>
          <StatTile
            label="Weekly form"
            value={weeklyEvaluation ? `${weeklyEvaluation.overallScore}` : "—"}
            sub={
              weeklyEvaluation ? (
                <>
                  <span>out of 10</span>
                  {trendValues.length > 1 && <Sparkline values={trendValues} />}
                </>
              ) : (
                "not scored yet"
              )
            }
            accent="info"
            href="/player/performance"
          />
        </div>
      </div>

      <div className="animate-stagger-rise grid gap-4 lg:grid-cols-2" style={{ animationDelay: "350ms" }}>
        <Card as="section">
          <SectionTitle>Monthly performance</SectionTitle>
          {monthlyEvaluation ? (
            <>
              <p className="mt-2 font-condensed text-3xl font-bold tabular text-flame-ink">
                {Number(monthlyEvaluation.overallScore)}
                <span className="text-lg text-ink-faint"> / 10</span>
              </p>
              {monthlyTrend.length > 1 && (
                <div className="mt-3 flex items-end gap-1.5" style={{ height: 60 }}>
                  {monthlyTrend.map((m, i) => (
                    <div
                      key={i}
                      title={`${Number(m.overallScore)}/10`}
                      className="w-6 rounded-t bg-flame/70"
                      style={{ height: `${(Number(m.overallScore) / 10) * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-dim">No monthly evaluation yet.</p>
          )}
        </Card>

        <Card as="section">
          <SectionTitle>New training video</SectionTitle>
          {latestVideo ? (
            <>
              <p className="mt-2 font-semibold text-ink">{latestVideo.title}</p>
              <p className="text-sm text-ink-dim">{latestVideo.category.replace(/_/g, " ")}</p>
              <Link href="/player/videos" className="mt-3 inline-block text-sm font-semibold text-flame-ink hover:underline">
                Watch now →
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-dim">No videos assigned yet.</p>
          )}
        </Card>
      </div>

      <ScrollReveal>
        <Card as="section">
          <SectionTitle>Coach feedback</SectionTitle>
          {latestFeedback ? (
            <>
              <p className="mt-2 italic text-ink">&ldquo;{latestFeedback.message}&rdquo;</p>
              <p className="mt-1 text-xs text-ink-faint">— {latestFeedback.coach.user.name}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-dim">No feedback yet.</p>
          )}
        </Card>
      </ScrollReveal>

      <ScrollReveal delayMs={80}>
      <Card as="section">
        <div className="flex items-center justify-between">
          <SectionTitle>Recent notifications</SectionTitle>
          <Link href="/player/notifications" className="text-sm font-semibold text-flame-ink hover:underline">
            View all →
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-ink-dim">Nothing yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {notifications.map((n) => (
              <li key={n.id} className={`py-2 text-sm ${n.isRead ? "text-ink-dim" : "font-medium text-ink"}`}>
                {n.title}
              </li>
            ))}
          </ul>
        )}
      </Card>
      </ScrollReveal>
    </main>
  );
}
