import type { ReactNode } from "react";
import Marquee from "./Marquee";

/** Faint oversized basketball line-art, bleeding off the corner — the same
 *  "ghost graphic behind bold type" move as the player-profile hero's jersey
 *  number, generalised for pages with no jersey number to draw on. */
function GhostBall() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 text-ink opacity-[0.04] sm:h-72 sm:w-72"
    >
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

/**
 * The one big hero moment per dashboard — bold two-tone headline (à la Thuze /
 * Paris Basketball's marketing pages), a ghost basketball watermark, and an
 * optional live fact ticker. Deliberately used only on the three dashboard
 * landing pages, not on every list/settings page — one hero moment reads as
 * confident, twenty of them reads as noise and gets in the way of the actual
 * work those other pages are for.
 */
export default function DashboardHero({
  eyebrow,
  greeting,
  name,
  lead,
  facts = [],
}: {
  eyebrow: string;
  greeting: string;
  name?: string;
  lead: ReactNode;
  facts?: string[];
}) {
  return (
    <div className="animate-stagger-rise relative overflow-hidden rounded-card border border-line bg-surface px-6 py-7 sm:px-8 sm:py-9">
      <GhostBall />
      <div className="relative">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-flame">{eyebrow}</p>
        <h1 className="mt-2 font-display text-[2.5rem] font-extrabold uppercase leading-[0.92] tracking-tight text-ink sm:text-6xl">
          {greeting}
          {name && (
            <>
              <br />
              <span className="bg-gradient-to-br from-flame to-ember bg-clip-text text-transparent">{name}</span>
            </>
          )}
        </h1>
        <p className="mt-3 max-w-xl text-ink-dim">{lead}</p>
        <Marquee items={facts} />
      </div>
    </div>
  );
}
