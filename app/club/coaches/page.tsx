import type { Metadata } from "next";

import { getPublicCoaches } from "@/lib/public-site";
import ScrollReveal from "@/components/player/ScrollReveal";
import PersonCard from "@/components/public/PersonCard";

export const metadata: Metadata = { title: "Coaching staff" };

export default async function PublicCoachesPage() {
  const coaches = await getPublicCoaches(60);

  return (
    <>
      <section className="border-b border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="animate-hero-rise font-mono text-xs uppercase tracking-[0.3em] text-flame-ink">Coaching staff</p>
          <h1 className="animate-hero-rise mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight text-ink sm:text-7xl" style={{ animationDelay: "60ms" }}>
            The people
            <br />
            on the floor.
          </h1>
          <p className="animate-hero-rise mt-5 max-w-xl text-base leading-relaxed text-ink-dim" style={{ animationDelay: "140ms" }}>
            Shown here only once a coach opts in to a public profile.
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {coaches.length === 0 ? (
            <p className="text-sm text-ink-dim">No coach profiles are public yet — check back soon.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((c, i) => (
                <ScrollReveal key={c.id} delayMs={(i % 3) * 60}>
                  <PersonCard href={`/club/coaches/${c.id}`} name={c.name} photoUrl={c.photoUrl} line={c.roleLine} bio={c.bio} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
