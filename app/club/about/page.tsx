import type { Metadata } from "next";
import Link from "next/link";

import ScrollReveal from "@/components/player/ScrollReveal";

export const metadata: Metadata = { title: "About" };

const VALUES = [
  { title: "Everyone develops", body: "Minutes are earned. Coaching isn't. Every player on the roster gets a plan and a review, top of the rotation or bottom." },
  { title: "Families see the work", body: "Session plans, attendance and feedback are shared, not locked in a coach's head. You should never have to guess how it's going." },
  { title: "Safeguarding first", body: "Trained staff on every court. Nothing about a junior player is published without a guardian approving it." },
  { title: "Cost is never the reason", body: "Hardship support exists, it's quiet, and asking for it changes nothing about how a player is treated." },
];

export default function PublicAboutPage() {
  return (
    <>
      <section className="border-b border-line px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="animate-hero-rise font-mono text-xs uppercase tracking-[0.3em] text-flame-ink">About the club</p>
          <h1 className="animate-hero-rise mt-3 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight text-ink sm:text-7xl" style={{ animationDelay: "60ms" }}>
            A club, not an
            <br />
            academy pipeline.
          </h1>
          <p className="animate-hero-rise mt-5 max-w-xl text-base leading-relaxed text-ink-dim" style={{ animationDelay: "140ms" }}>
            We&apos;re a community basketball club running juniors through seniors out of one gym. Some of our
            players will go on to play at a high level. Most won&apos;t — and the season should be worth it either
            way.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
            What we hold ourselves to
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <ScrollReveal key={v.title} delayMs={i * 60}>
                <div className="rounded-card border border-line bg-surface p-6">
                  <p className="font-display text-lg font-bold text-ink">{v.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">{v.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-surface p-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Where we play</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-dim">
              This is where the club&apos;s venue name, address and parking notes go — ask the club to add its real
              details here.
            </p>
          </div>
          <div className="rounded-card border border-line bg-surface p-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Get in touch</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-dim">
              This is where the club&apos;s contact email and safeguarding lead go — ask the club to add its real
              details here.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-block rounded-full bg-gradient-to-br from-flame to-ember px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-on-flame"
            >
              Register interest
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
