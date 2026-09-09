import type { Metadata } from "next";

import { getPublicPlayers } from "@/lib/public-site";
import RosterGrid from "@/components/public/RosterGrid";

export const metadata: Metadata = { title: "Roster" };

export default async function PublicRosterPage() {
  const players = await getPublicPlayers(200);

  return (
    <>
      <section className="border-b border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="animate-hero-rise font-mono text-xs uppercase tracking-[0.3em] text-flame-ink">Roster</p>
          <h1 className="animate-hero-rise mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight text-ink sm:text-7xl" style={{ animationDelay: "60ms" }}>
            The squad.
          </h1>
          <p className="animate-hero-rise mt-5 max-w-xl text-base leading-relaxed text-ink-dim" style={{ animationDelay: "140ms" }}>
            Every profile here is published with the player&apos;s — and for juniors, their guardian&apos;s —
            explicit permission. Players who haven&apos;t opted in simply don&apos;t appear.
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <RosterGrid players={players} />
        </div>
      </section>
    </>
  );
}
