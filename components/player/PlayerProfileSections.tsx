import type { PlayerProfileView } from "@/lib/player-profile-view";
import ScrollReveal from "./ScrollReveal";
import HighlightsSection from "./HighlightsSection";

function timeAgo(date: Date): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "a week ago" : `${weeks} weeks ago`;
}

function BreakdownBar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{label}</p>
        <p className="font-condensed text-sm font-bold tabular text-ink">{count}</p>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Content below the hero — only renders sections there's real data for.
 *  Each one reveals as it scrolls into view, staggered, so scrolling down
 *  the page has a sense of things arriving rather than everything at once. */
export default function PlayerProfileSections({
  player,
  editable = false,
}: {
  player: PlayerProfileView;
  /** Show the add/remove highlight controls — only true on the player's own profile page. */
  editable?: boolean;
}) {
  const b = player.attendanceBreakdown;
  const totalCounted = b ? b.present + b.late + b.absent : 0;

  return (
    <div className="flex flex-col gap-5">
      {(player.highlights.length > 0 || editable) && (
        <ScrollReveal>
          <HighlightsSection playerId={player.id} initial={player.highlights} editable={editable} />
        </ScrollReveal>
      )}

      {player.bio && (
        <ScrollReveal delayMs={90}>
          <section className="rounded-card border border-line bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">About</p>
            <p className="mt-2 text-sm text-ink-dim">{player.bio}</p>
          </section>
        </ScrollReveal>
      )}

      {player.canSeeStats && b && totalCounted > 0 && (
        <ScrollReveal delayMs={180}>
          <section className="rounded-card border border-line bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Season snapshot</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <BreakdownBar label="Present" count={b.present} total={totalCounted} colorClass="bg-success" />
              <BreakdownBar label="Late" count={b.late} total={totalCounted} colorClass="bg-warning" />
              <BreakdownBar label="Absent" count={b.absent} total={totalCounted} colorClass="bg-danger" />
              <BreakdownBar label="Excused" count={b.excused} total={totalCounted + b.excused} colorClass="bg-info" />
            </div>
          </section>
        </ScrollReveal>
      )}

      {player.canSeeStats && player.latestFeedback && (
        <ScrollReveal delayMs={270}>
          <section className="rounded-card border border-line bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Latest coach feedback</p>
            <p className="mt-2 italic text-ink">&ldquo;{player.latestFeedback.message}&rdquo;</p>
            <p className="mt-1.5 text-xs text-ink-faint">
              — {player.latestFeedback.coachName} · {timeAgo(player.latestFeedback.createdAt)}
            </p>
          </section>
        </ScrollReveal>
      )}
    </div>
  );
}
