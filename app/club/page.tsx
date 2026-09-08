import Link from "next/link";

import { getClubStats, getPublicTeams, getPublicPlayers, getPublicCoaches } from "@/lib/public-site";
import CountUp from "@/components/player/CountUp";
import ScrollReveal from "@/components/player/ScrollReveal";

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

function PersonCard({
  href,
  name,
  photoUrl,
  line,
  bio,
}: {
  href: string;
  name: string;
  photoUrl: string | null;
  line: string | null;
  bio: string | null;
}) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <Link
      href={href}
      className="group block rounded-card border border-line bg-surface p-5 transition duration-200 hover:-translate-y-1 hover:border-flame/40 hover:shadow-[0_16px_36px_-16px_rgb(var(--flame)/0.35)]"
    >
      <div className="flex items-center gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-16 w-16 flex-none rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-gradient-to-br from-flame to-ember font-condensed text-xl font-bold text-on-flame">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-ink">{name}</p>
          {line && <p className="font-mono text-[11px] uppercase tracking-wider text-flame-ink">{line}</p>}
        </div>
      </div>
      {bio && <p className="mt-3 line-clamp-2 text-sm text-ink-dim">{bio}</p>}
      <span className="mt-3 inline-block text-xs font-semibold text-flame-ink opacity-0 transition group-hover:opacity-100">
        View profile →
      </span>
    </Link>
  );
}

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
        <GhostBall className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-on-flame/10 sm:h-[28rem] sm:w-[28rem]" />
        <div className="relative mx-auto max-w-4xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-on-flame/80">DYNI Blazers</p>
          <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight text-on-flame sm:text-7xl">
            Every rep
            <br />
            counts.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-on-flame/85">
            A junior-to-senior basketball club built on real coaching, real development, and a team that shows up
            for each other. Come see what we&apos;re about.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-ground px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink shadow-pop transition hover:-translate-y-0.5"
            >
              Join the club
            </Link>
            <a
              href="#players"
              className="rounded-full border-2 border-on-flame/40 px-6 py-3 text-sm font-bold uppercase tracking-wide text-on-flame transition hover:border-on-flame"
            >
              Meet the players
            </a>
          </div>
        </div>

        {/* Live stat strip, Paris-Basketball style */}
        <div className="relative mt-16 grid grid-cols-2 gap-6 border-t border-on-flame/20 pt-8 sm:grid-cols-4">
          {[
            { label: "Teams", value: stats.teams },
            { label: "Active players", value: stats.players },
            { label: "Coaches", value: stats.coaches },
            { label: "Seasons running", value: stats.seasons },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-condensed text-4xl font-bold tabular text-on-flame sm:text-5xl">
                <CountUp value={s.value} />
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-on-flame/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Teams */}
      <section id="teams" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <ScrollReveal>
          <p className="font-mono text-xs uppercase tracking-wider text-flame-ink">Our teams</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
            Junior to senior, one club
          </h2>
        </ScrollReveal>
        <div className="mt-8 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t, i) => (
            <ScrollReveal key={t.id} delayMs={i * 60}>
              <div className="rounded-card border border-line bg-surface p-5 transition duration-200 hover:-translate-y-1 hover:border-flame/40 hover:shadow-[0_16px_36px_-16px_rgb(var(--flame)/0.35)]">
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
            <p className="font-mono text-xs uppercase tracking-wider text-flame-ink">Meet the players</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
              The team, on and off the court
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-dim">
              Shown here only with the player&apos;s (and, for juniors, their guardian&apos;s) explicit permission.
            </p>
          </ScrollReveal>
          <div className="mt-8 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p, i) => (
              <ScrollReveal key={p.id} delayMs={(i % 3) * 60}>
                <PersonCard
                  href={`/club/players/${p.id}`}
                  name={p.name}
                  photoUrl={p.photoUrl}
                  line={[p.position, p.team].filter(Boolean).join(" · ") || null}
                  bio={p.bio}
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
          <p className="font-mono text-xs uppercase tracking-wider text-flame-ink">Coaching staff</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
            Real coaching, every session
          </h2>
        </ScrollReveal>
        <div className="mt-8 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c, i) => (
            <ScrollReveal key={c.id} delayMs={(i % 3) * 60}>
              <PersonCard href={`/club/coaches/${c.id}`} name={c.name} photoUrl={c.photoUrl} line="Coach" bio={c.bio} />
            </ScrollReveal>
          ))}
          {coaches.length === 0 && <p className="text-sm text-ink-dim">No coach profiles are public yet — check back soon.</p>}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-flame to-ember px-5 py-16 text-center sm:px-8">
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
      </section>
    </>
  );
}
