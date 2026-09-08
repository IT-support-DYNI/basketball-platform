import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublicCoach } from "@/lib/public-site";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const coach = await getPublicCoach(Number(params.id));
  return { title: coach ? coach.name : "Coach" };
}

export default async function PublicCoachPage({ params }: { params: { id: string } }) {
  const coachId = Number(params.id);
  if (!Number.isInteger(coachId)) notFound();

  const coach = await getPublicCoach(coachId);
  if (!coach) notFound();

  const initials = coach.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <article className="mx-auto max-w-2xl px-5 py-14 sm:px-8">
      <div className="animate-hero-rise overflow-hidden rounded-card shadow-pop">
        <div className="flex items-center gap-5 bg-gradient-to-br from-flame via-flame to-ember px-6 py-8 sm:px-10">
          {coach.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coach.photoUrl} alt="" className="h-28 w-28 flex-none rounded-full border-4 border-on-flame/30 object-cover shadow-pop sm:h-36 sm:w-36" />
          ) : (
            <div className="flex h-28 w-28 flex-none items-center justify-center rounded-full border-4 border-on-flame/30 bg-black/15 font-condensed text-4xl font-bold text-on-flame shadow-pop sm:h-36 sm:w-36">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-wider text-on-flame/80">Coach</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-on-flame sm:text-5xl">
              {coach.name}
            </h1>
          </div>
        </div>
      </div>

      {coach.bio && (
        <section className="mt-6 rounded-card border border-line bg-surface p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-card">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">About</p>
          <p className="mt-2 text-ink-dim">{coach.bio}</p>
        </section>
      )}
    </article>
  );
}
