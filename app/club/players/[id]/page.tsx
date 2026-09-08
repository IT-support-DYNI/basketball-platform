import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublicPlayer } from "@/lib/public-site";
import ScrollReveal from "@/components/player/ScrollReveal";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const player = await getPublicPlayer(Number(params.id));
  return { title: player ? player.name : "Player" };
}

export default async function PublicPlayerPage({ params }: { params: { id: string } }) {
  const playerId = Number(params.id);
  if (!Number.isInteger(playerId)) notFound();

  const player = await getPublicPlayer(playerId);
  if (!player) notFound();

  const initials = player.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <div className="animate-hero-rise overflow-hidden rounded-card shadow-pop">
        <div className="relative bg-gradient-to-br from-flame via-flame to-ember px-6 pb-14 pt-8 sm:px-10">
          {player.jerseyNumber != null && (
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 -top-8 select-none font-condensed text-[10rem] font-black leading-none text-on-flame/10 sm:text-[13rem]"
            >
              {player.jerseyNumber}
            </span>
          )}
          <div className="relative flex items-center gap-5">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photoUrl} alt="" className="h-28 w-28 flex-none rounded-full border-4 border-on-flame/30 object-cover shadow-pop sm:h-36 sm:w-36" />
            ) : (
              <div className="flex h-28 w-28 flex-none items-center justify-center rounded-full border-4 border-on-flame/30 bg-black/15 font-condensed text-4xl font-bold text-on-flame shadow-pop sm:h-36 sm:w-36">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-wider text-on-flame/80">
                {[player.team, player.position, player.jerseyNumber != null ? `#${player.jerseyNumber}` : null].filter(Boolean).join(" · ") || "DYNI Blazers"}
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-on-flame sm:text-5xl">
                {player.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {player.bio && (
        <ScrollReveal>
          <section className="mt-6 rounded-card border border-line bg-surface p-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">About</p>
            <p className="mt-2 text-ink-dim">{player.bio}</p>
          </section>
        </ScrollReveal>
      )}

      {player.highlights.length > 0 && (
        <ScrollReveal delayMs={90}>
          <section className="mt-6 rounded-card border border-line bg-surface p-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Highlights</p>
            <ul className="mt-3 flex flex-col gap-2">
              {player.highlights.map((h) => (
                <li key={h.id}>
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-control border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-ink transition hover:border-flame/40 hover:text-flame-ink"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-none text-flame-ink" aria-hidden="true">
                      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" />
                    </svg>
                    {h.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </ScrollReveal>
      )}
    </article>
  );
}
