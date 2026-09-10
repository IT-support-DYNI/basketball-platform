import type { PlayerProfileView } from "@/lib/player-profile-view";
import CountUp from "./CountUp";
import PhotoUpload from "./PhotoUpload";

const POSITION_LABEL: Record<string, string> = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C: "Centre",
};

function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** One cell in the divided stat strip below the hero — the vertical rules
 *  between cells (via the parent's `divide-x`) are the point, echoing the
 *  boxed NBA.com stat-line look rather than a loose wrapped list. */
function StatCell({ label, value, tone = "text-ink" }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="min-w-[5.5rem] flex-1 px-5 py-4 transition duration-150 hover:bg-white/[0.03]">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className={`mt-1 truncate font-condensed text-xl font-bold tabular sm:text-2xl ${tone}`}>{value ?? "—"}</p>
    </div>
  );
}

/** Colour is semantic here, not decorative — it tells a coach at a glance
 *  whether a number needs attention, same idea as StatTile's accent system. */
function attendanceColor(pct: number): string {
  if (pct >= 85) return "text-success";
  if (pct >= 60) return "text-warning";
  return "text-danger";
}
function formColor(score: number): string {
  // Gold for a standout score — the brief's "gold for standout statistics"
  // idea, using the token that already exists for exactly this (--gold,
  // "flame-tip highlight, live indicator" in app/globals.css) rather than
  // introducing a new colour.
  if (score >= 9) return "text-gold";
  if (score >= 7.5) return "text-success";
  if (score >= 5) return "text-warning";
  return "text-danger";
}

/** The NBA.com-style profile hero: team-colour band, cutout-style avatar,
 *  a headline stat strip. Built from whatever the field-visibility engine
 *  actually returned for this viewer — a fact this component never sees is
 *  simply not rendered, never blanked-but-present. */
export default function PlayerProfileHero({
  player,
  editable = false,
}: {
  player: PlayerProfileView;
  /** Show the change-photo control — only true on the player's own profile page. */
  editable?: boolean;
}) {
  const initials = player.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="animate-hero-rise overflow-hidden rounded-card shadow-pop">
      {/* Hero band */}
      <div className="relative overflow-hidden bg-gradient-to-br from-flame via-flame to-ember">
        {/* ghost jersey number watermark */}
        {player.jerseyNumber != null && (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 -top-6 select-none font-condensed text-[9rem] font-black leading-none text-on-flame/10 sm:text-[12rem]"
          >
            {player.jerseyNumber}
          </span>
        )}

        {/* club crest strip — its own row so it never collides with the
         *  photo beneath it (the reference's crest overlaps its player's
         *  photo because that's a transparent cutout PNG; ours are plain
         *  uploaded rectangles, so a shared row is the honest equivalent) */}
        <div className="relative flex items-center gap-2 px-5 pt-4 sm:px-8 sm:pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/dyni-crest-256.png" alt="" aria-hidden="true" className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-on-flame/70">DYNI Blazers</span>
        </div>

        <div className="relative mt-3 flex h-40 items-stretch gap-5 pr-6 sm:h-48 sm:pr-8">
          {/* photo — a cropped rectangle flush to the bottom of the band,
           *  not a floating circle, to match the cutout-to-the-edge look */}
          <div className="animate-avatar-pop relative w-28 flex-none sm:w-40">
            {/* overflow-hidden lives on this inner wrapper, not the outer
             *  relative one — otherwise it clips PhotoUpload's edit badge,
             *  which deliberately hangs off the corner via negative insets */}
            <div className="h-full w-full overflow-hidden">
              {player.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.photoUrl} alt="" className="h-full w-full object-cover object-top transition duration-200 hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black/15 font-condensed text-4xl font-bold text-on-flame">
                  {initials}
                </div>
              )}
            </div>
            {editable && <PhotoUpload playerId={player.id} />}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="font-mono text-xs uppercase tracking-wider text-on-flame/80">
              {[player.team, player.position ? POSITION_LABEL[player.position] : null, player.jerseyNumber != null ? `#${player.jerseyNumber}` : null]
                .filter(Boolean)
                .join(" · ") || "DYNI Blazers"}
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-on-flame sm:text-5xl">
              {player.name}
            </h1>
            {player.status && player.status !== "ACTIVE" && (
              <span className="mt-2 inline-block w-fit rounded-full bg-black/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-on-flame">
                {player.status.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat strip — a divided grid (vertical rules between cells), flush
       *  below the hero with no overlap into the colour band. */}
      <div className="grid grid-cols-2 divide-x divide-y divide-line border-t border-line bg-[rgb(20_20_25)] sm:grid-cols-4 sm:divide-y-0 lg:grid-cols-7">
        {player.canSeeStats && player.attendancePct != null && (
          <StatCell label="Attendance" value={<CountUp value={player.attendancePct} suffix="%" />} tone={attendanceColor(player.attendancePct)} />
        )}
        {player.canSeeStats && player.weeklyForm != null && (
          <StatCell
            label="Form"
            value={
              <>
                <CountUp value={player.weeklyForm} decimals={1} />
                <span className="text-base text-ink-faint">/10</span>
              </>
            }
            tone={formColor(player.weeklyForm)}
          />
        )}
        <StatCell label="Height" value={player.heightCm ? `${(player.heightCm / 100).toFixed(2)}m` : null} />
        <StatCell label="Weight" value={player.weightKg ? `${player.weightKg}kg` : null} />
        <StatCell label="Country" value={countryName(player.nationality)} />
        <StatCell label="Age" value={player.age != null ? `${player.age} yrs` : null} />
        {player.preferredHand && (
          <StatCell
            label="Hand"
            value={player.preferredHand === "AMBIDEXTROUS" ? "Both" : player.preferredHand[0] + player.preferredHand.slice(1).toLowerCase()}
          />
        )}
      </div>
    </div>
  );
}
