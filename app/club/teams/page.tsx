import type { Metadata } from "next";
import Link from "next/link";

import { getPublicTeams } from "@/lib/public-site";
import ScrollReveal from "@/components/player/ScrollReveal";

export const metadata: Metadata = { title: "Teams" };

export default async function PublicTeamsPage() {
  const teams = await getPublicTeams();

  return (
    <>
      <section className="border-b border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="animate-hero-rise font-mono text-xs uppercase tracking-[0.3em] text-flame-ink">Teams &amp; programs</p>
          <h1 className="animate-hero-rise mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight text-ink sm:text-7xl" style={{ animationDelay: "60ms" }}>
            One club,
            <br />
            one standard.
          </h1>
          <p className="animate-hero-rise mt-5 max-w-xl text-base leading-relaxed text-ink-dim" style={{ animationDelay: "140ms" }}>
            Every squad runs the same session structure and the same development framework. What changes is the
            level, not the care.
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-5xl">
          {teams.length === 0 ? (
            <p className="text-sm text-ink-dim">Teams will appear here once the club sets them up.</p>
          ) : (
            <div className="overflow-x-auto rounded-card border border-line bg-surface">
              <div className="grid min-w-[560px] grid-cols-[1.5fr_0.8fr_1fr] gap-4 border-b border-line bg-surface-2 px-5 py-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Team</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Age group</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Players</span>
              </div>
              {teams.map((t, i) => (
                <ScrollReveal key={t.id} delayMs={i * 40}>
                  <div className="grid min-w-[560px] grid-cols-[1.5fr_0.8fr_1fr] items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
                    <div>
                      <p className="font-display text-base font-bold text-ink">{t.name}</p>
                      {t.description && <p className="mt-1 text-sm text-ink-dim">{t.description}</p>}
                    </div>
                    <span className="text-sm text-ink-dim">{t.ageGroup ?? "—"}</span>
                    <span className="font-mono text-xs uppercase tracking-wide text-ink-dim">
                      {t.memberCount} {t.memberCount === 1 ? "player" : "players"}
                    </span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
            What a season includes
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", title: "Coached sessions every week", body: "Planned in advance and shared with families, so you know what's being worked on." },
              { n: "02", title: "A development plan", body: "Goals for the block, reviewed with the player and their guardian." },
              { n: "03", title: "Fixtures and match play", body: "League basketball from the older age groups; festival-format games for juniors." },
              { n: "04", title: "Kit and club membership", body: "Hardship support is available and it stays private." },
            ].map((item, i) => (
              <ScrollReveal key={item.n} delayMs={i * 60}>
                <div className="rounded-card border border-line bg-surface p-6">
                  <p className="font-condensed text-4xl font-bold text-flame">{item.n}</p>
                  <p className="mt-2 font-display text-lg font-bold text-ink">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">{item.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 pt-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-8">
          <div>
            <p className="font-display text-xl font-bold text-ink">Ready to find your team?</p>
            <p className="mt-1 text-sm text-ink-dim">Registration is reviewed by the club before anyone gets access.</p>
          </div>
          <Link
            href="/register"
            className="flex-none rounded-full bg-gradient-to-br from-flame to-ember px-6 py-3 text-sm font-bold uppercase tracking-wide text-on-flame shadow-[0_0_18px_-3px_rgb(var(--flame)/0.55)]"
          >
            Start registration
          </Link>
        </div>
      </section>
    </>
  );
}
