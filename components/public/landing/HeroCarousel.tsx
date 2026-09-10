"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

export type HeroSlide = {
  label: string;
  eyebrow: string;
  /** Word-by-word reveal on the headline; the last word renders in the
   *  accent colour, matching `.hero h1 .w:last-child > span`. */
  words: string[];
  lead: string;
  tabTitle: string;
  ctas: { label: string; href: string; primary?: boolean }[];
};

const HOLD_MS = 7000;

function GhostBall() {
  return (
    <svg className="hero-watermark" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="4"></circle>
      <path
        d="M100 6v188M6 100h188M32 32c30 30 30 106 0 136M168 32c-30 30-30 106 0 136"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      ></path>
    </svg>
  );
}

/** The hero carousel: word-reveal headline, auto-advancing slides with a
 *  per-tab progress bar, pause-on-hover, and a cursor-follow spotlight glow
 *  (desktop + fine pointer only). Progress-bar widths are mutated directly
 *  via refs rather than React state — an animation frame loop driving state
 *  updates every tick would be needless re-render churn for a value nothing
 *  else reads. */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const activeRef = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const paint = (idx: number, pct: number) => {
    barRefs.current.forEach((bar, n) => {
      if (!bar) return;
      bar.style.width = `${n < idx ? 100 : n === idx ? pct : 0}%`;
    });
  };

  const goTo = (n: number) => {
    const next = (n + slides.length) % slides.length;
    setActive(next);
    activeRef.current = next;
    startRef.current = performance.now();
    paint(next, 0);
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      paint(0, 0);
      barRefs.current.forEach((bar, n) => {
        if (bar) bar.style.width = n === 0 ? "100%" : "0%";
      });
      return;
    }

    const tick = (now: number) => {
      const pct = Math.min(100, ((now - startRef.current) / HOLD_MS) * 100);
      paint(activeRef.current, pct);
      if (pct >= 100) goTo(activeRef.current + 1);
      rafRef.current = requestAnimationFrame(tick);
    };

    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    // Deliberately no pause-on-hover here — the exported design paused
    // autoplay on mouseenter, but hovering anywhere over the hero (which is
    // most of the viewport) to read a slide made the carousel look stuck.
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hero = heroRef.current;
    const glow = glowRef.current;
    if (!fine || reduce || !hero || !glow) return;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      glow.style.transform = `translate(${e.clientX - r.left}px,${e.clientY - r.top}px) translate(-50%,-50%)`;
      glow.style.opacity = "1";
    };
    const onLeave = () => {
      glow.style.opacity = "0";
    };
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="hero on-photo" id="hero" aria-label="Featured" ref={heroRef}>
      <div className="hero-glow" ref={glowRef}></div>
      <GhostBall />

      <div className="slides">
        {slides.map((slide, i) => (
          <article key={slide.label} className={`slide${i === active ? " on" : ""}`} data-screen-label={slide.label}>
            <div className="slide-copy">
              <p className="eyebrow">{slide.eyebrow}</p>
              <h1>
                {slide.words.map((word, wi) => (
                  // Fragment (not a span) so the .w spans + space text nodes
                  // stay direct children of <h1> — CSS's `.w:last-child`
                  // only means "last among true siblings", so wrapping each
                  // word in its own element would make every `.w` its own
                  // wrapper's only (hence "last") child, colouring the
                  // whole headline instead of just the final word.
                  <Fragment key={wi}>
                    <span className="w">
                      <span>{word}</span>
                    </span>
                    {wi < slide.words.length - 1 ? " " : ""}
                  </Fragment>
                ))}
              </h1>
              <p className="lead">{slide.lead}</p>
              <div className="hero-cta">
                {slide.ctas.map((cta) => (
                  <Link key={cta.label} className={`btn ${cta.primary ? "btn-primary" : "btn-secondary"}`} href={cta.href}>
                    {cta.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="slide-photo">
              <div className="photo"></div>
            </div>
          </article>
        ))}
      </div>

      <div className="tabs" role="tablist" aria-label="Featured stories">
        {slides.map((slide, i) => (
          <button
            key={slide.label}
            className="tab"
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => goTo(i)}
          >
            <span className="tab-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="tab-t">{slide.tabTitle}</span>
            <span className="tab-bar">
              <i
                ref={(el) => {
                  barRefs.current[i] = el;
                }}
              ></i>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
