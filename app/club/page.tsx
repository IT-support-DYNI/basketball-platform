import Link from "next/link";

import { getClubStats, getPublicTeams, getPublicPlayers, getPublicCoaches } from "@/lib/public-site";
import CountUp from "@/components/player/CountUp";
import ScrollReveal from "@/components/player/ScrollReveal";
import PersonCard from "@/components/public/PersonCard";

function GhostBall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="6" />
      <path
        d="M100 8v184M8 100h184M30 30c30 30 30 110 0 140M170 30c-30 30-30 110 0 140"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
      />
    </svg>
  );
}

const RIBBON_ITEMS = [
  "Junior to senior, one club",
  "Qualified coaches, every session",
  "Guardian-approved player profiles",
  "Development tracked, not guessed",
];

const CULTURE_POINTS = [
  "Guardian-approved profiles — nothing about a junior goes public by default.",
  "Session plans and attendance shared with families, not kept in a coach's notebook.",
  "Every player gets a development plan and feedback they can act on.",
];

export default async function ClubHomePage() {
  const [stats, teams, players, coaches] = await Promise.all([
    getClubStats(),
    getPublicTeams(),
    getPublicPlayers(9),
    getPublicCoaches(6),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-flame via-flame to-ember px-5 py-20 sm:px-8 sm:py-28">
        <GhostBall className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 animate-[spin_90s_linear_infinite] text-on-flame/10 sm:h-[28rem] sm:w-[28rem] motion-reduce:animate-none" />
        <div className="relative mx-auto max-w-4xl">
          <p className="animate-hero-rise font-mono text-xs font-bold uppercase tracking-[0.3em] text-on-flame/80">
            Junior to senior · one club
          </p>
          <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight text-on-flame sm:text-7xl">
            <span className="block animate-hero-rise" style={{ animationDelay: "60ms" }}>
              Every
            </span>
            <span className="block animate-hero-rise" style={{ animationDelay: "150ms" }}>
              rep
            </span>
            <span
              className="block animate-hero-rise bg-gradient-to-br from-on-flame to-gold bg-clip-text text-transparent"
              style={{ animationDelay: "240ms" }}
            >
              counts.
            </span>
          </h1>
          <p className="mt-5 max-w-xl animate-hero-rise text-lg text-on-flame/85" style={{ animationDelay: "340ms" }}>
            A community club where every player gets coached properly — juniors through seniors, on the same floor,
            with the same standards. Come and see what we&apos;re about.
          </p>
          <div className="mt-8 flex animate-hero-rise flex-wrap gap-3" style={{ animationDelay: "420ms" }}>
            <Link
              href="/register"
              className="rounded-full bg-ground px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink shadow-pop transition hover:-translate-y-0.5"
            >
              Start registration
            </Link>
            <Link
              href="/club/roster"
              className="rounded-full border-2 border-on-flame/40 px-6 py-3 text-sm font-bold uppercase tracking-wide text-on-flame transition hover:border-on-flame"
            >
              Meet the players
            </Link>
          </div>
        </div>

        {/* Live stat strip */}
        <div className="relative mt-16 grid grid-cols-2 gap-6 border-t border-on-flame/20 pt-8 sm:grid-cols-4">
          {[
            { label: "Teams", value: stats.teams },
            { label: "Active players", value: stats.players },
            { label: "Coaches", value: stats.coaches },
            { label: "Seasons running", value: stats.seasons },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-condensed text-4xl font-bold tabular-nums text-on-flame sm:text-5xl">
                <CountUp value={s.value} />
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-on-flame/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value ribbon */}
      <div className="overflow-hidden bg-gradient-to-r from-flame to-ember py-3">
        <div className="animate-marquee flex w-max items-center gap-0">
          {[false, true].map((dup) => (
            <div key={String(dup)} className={dup ? "marquee-dup flex items-center" : "flex items-center"}>
              {RIBBON_ITEMS.map((item) => (
                <span key={item} className="flex items-center whitespace-nowrap">
                  <span className="px-6 font-condensed text-lg font-bold uppercase tracking-wide text-on-flame">{item}</span>
                  <span aria-hidden="true" className="text-on-flame/50">
                    ◆
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Teams */}
      <section id="teams" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-flame-ink">Our teams</p>
              <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
                Junior to senior, one club
              </h2>
            </div>
            <Link href="/club/teams" className="flex-none rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink hover:border-flame/40">
              All teams
            </Link>
          </div>
        </ScrollReveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.slice(0, 6).map((t, i) => (
            <ScrollReveal key={t.id} delayMs={i * 60}>
              <div className="rounded-card border border-line bg-surface p-5">
                <p className="font-display text-xl font-bold text-ink">{t.name}</p>
                {t.ageGroup && <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{t.ageGroup}</p>}
                {t.description && <p className="mt-2 text-sm text-ink-dim">{t.description}</p>}
              </div>
            </ScrollReveal>
          ))}
          {teams.length === 0 && <p className="text-sm text-ink-dim">Teams will appear here once the club sets them up.</p>}
        </div>
      </section>

      {/* Players */}
      <section id="players" className="bg-surface px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-flame-ink">Meet the players</p>
                <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
                  The team, on and off the court
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-ink-dim">
                  Shown here only with the player&apos;s (and, for juniors, their guardian&apos;s) explicit permission.
                </p>
              </div>
              <Link href="/club/roster" className="flex-none rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink hover:border-flame/40">
                Full roster
              </Link>
            </div>
          </ScrollReveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p, i) => (
              <ScrollReveal key={p.id} delayMs={(i % 3) * 60}>
                <PersonCard
                  href={`/club/players/${p.id}`}
                  name={p.name}
                  photoUrl={p.photoUrl}
                  line={[p.positionLabel, p.team].filter(Boolean).join(" · ") || null}
                  bio={p.bio}
                  jerseyNumber={p.jerseyNumber}
                />
              </ScrollReveal>
            ))}
            {players.length === 0 && (
              <p className="text-sm text-ink-dim">No player profiles are public yet — check back soon.</p>
            )}
          </div>
        </div>
      </section>

      {/* Coaches */}
      <section id="coaches" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-flame-ink">Coaching staff</p>
              <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
                Real coaching, every session
              </h2>
            </div>
            <Link href="/club/coaches" className="flex-none rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink hover:border-flame/40">
              All staff
            </Link>
          </div>
        </ScrollReveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c, i) => (
            <ScrollReveal key={c.id} delayMs={(i % 3) * 60}>
              <PersonCard href={`/club/coaches/${c.id}`} name={c.name} photoUrl={c.photoUrl} line={c.roleLine} bio={c.bio} />
            </ScrollReveal>
          ))}
          {coaches.length === 0 && <p className="text-sm text-ink-dim">No coach profiles are public yet — check back soon.</p>}
        </div>
      </section>

      {/* Culture */}
      <section className="bg-surface px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="font-mono text-xs uppercase tracking-wider text-flame-ink">Our culture</p>
            <h2 className="mt-1 max-w-xl font-display text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
              Nobody sits on the bench for a season
            </h2>
            <div className="mt-6 flex max-w-xl flex-col gap-3">
              {CULTURE_POINTS.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-flame" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-ink">{point}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-flame to-ember px-5 py-16 text-center sm:px-8">
        <GhostBall className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 text-on-flame/10" />
        <div className="relative">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-on-flame sm:text-4xl">
            Ready to play?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-on-flame/85">
            Registration takes a few minutes, and every application is reviewed by the club before anyone gets full
            access.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-full bg-ground px-7 py-3 text-sm font-bold uppercase tracking-wide text-ink shadow-pop transition hover:-translate-y-0.5"
          >
            Start registration
          </Link>
        </div>
      </section>
    </>
  );
}
