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

function Fact({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="min-w-[5.5rem] rounded-lg px-2 py-1 transition duration-150 hover:-translate-y-0.5 hover:bg-white/[0.06]">
      <p className="font-mono text-[10px] uppercase tracking-wider text-on-flame/70">{label}</p>
      <p className="mt-0.5 font-condensed text-lg font-bold tabular text-on-flame">{value ?? "—"}</p>
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
      <div className="relative bg-gradient-to-br from-flame via-flame to-ember px-6 pb-16 pt-6 sm:px-8 sm:pt-8">
        {/* ghost jersey number watermark */}
        {player.jerseyNumber != null && (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 -top-6 select-none font-condensed text-[9rem] font-black leading-none text-on-flame/10 sm:text-[12rem]"
          >
            {player.jerseyNumber}
          </span>
        )}

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-wider text-on-flame/80">
              {[player.team, player.position ? POSITION_LABEL[player.position] : null, player.jerseyNumber != null ? `#${player.jerseyNumber}` : null]
                .filter(Boolean)
                .join(" · ") || "DYNI Blazers"}
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-on-flame sm:text-5xl">
              {player.name}
            </h1>
            {player.status && player.status !== "ACTIVE" && (
              <span className="mt-2 inline-block rounded-full bg-black/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-on-flame">
                {player.status.replace(/_/g, " ")}
              </span>
            )}
          </div>

          <div className="animate-avatar-pop relative shrink-0 transition duration-200 hover:scale-105">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photoUrl}
                alt=""
                className="h-24 w-24 rounded-full border-4 border-on-flame/30 object-cover shadow-pop transition duration-200 hover:border-on-flame/60 sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-on-flame/30 bg-black/15 font-condensed text-3xl font-bold text-on-flame shadow-pop transition duration-200 hover:border-on-flame/60 sm:h-32 sm:w-32 sm:text-4xl">
                {initials}
              </div>
            )}
            {editable && <PhotoUpload playerId={player.id} />}
          </div>
        </div>
      </div>

      {/* Stat strip — overlaps the hero band bottom edge, NBA.com-style */}
      <div className="-mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-t-2xl bg-[rgb(20_20_25)] px-6 py-5 sm:px-8">
        {player.canSeeStats && (player.attendancePct != null || player.weeklyForm != null) && (
          <div className="flex gap-8 border-r border-on-flame/15 pr-8">
            {player.attendancePct != null && (
              <div className="rounded-lg px-1.5 py-1 transition duration-150 hover:-translate-y-0.5 hover:bg-white/[0.04]">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Attendance</p>
                <p className={`mt-0.5 font-condensed text-3xl font-bold tabular ${attendanceColor(player.attendancePct)}`}>
                  <CountUp value={player.attendancePct} suffix="%" />
                </p>
              </div>
            )}
            {player.weeklyForm != null && (
              <div className="rounded-lg px-1.5 py-1 transition duration-150 hover:-translate-y-0.5 hover:bg-white/[0.04]">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Form</p>
                <p className={`mt-0.5 font-condensed text-3xl font-bold tabular ${formColor(player.weeklyForm)}`}>
                  <CountUp value={player.weeklyForm} decimals={1} />
                  <span className="text-base text-ink-faint">/10</span>
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Fact label="Height" value={player.heightCm ? `${(player.heightCm / 100).toFixed(2)}m` : null} />
          <Fact label="Weight" value={player.weightKg ? `${player.weightKg}kg` : null} />
          <Fact label="Country" value={countryName(player.nationality)} />
          <Fact label="Age" value={player.age != null ? `${player.age} yrs` : null} />
          {player.preferredHand && <Fact label="Hand" value={player.preferredHand === "AMBIDEXTROUS" ? "Both" : player.preferredHand[0] + player.preferredHand.slice(1).toLowerCase()} />}
        </div>
      </div>
    </div>
  );
}
