"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Fades + slides a section up as it scrolls into view, once. Under
 * prefers-reduced-motion it skips the observer entirely and just renders the
 * content — no delayed appearance, nothing to wait for.
 */
export default function ScrollReveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSkipAnimation(true);
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        skipAnimation
          ? undefined
          : {
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(18px)",
              transition: `opacity 480ms cubic-bezier(0.16,1,0.3,1) ${delayMs}ms, transform 480ms cubic-bezier(0.16,1,0.3,1) ${delayMs}ms`,
              // Without this, Chromium sometimes leaves a stale rasterized
              // border/corner behind on a bordered, rounded child once the
              // transform settles — a real, reproducible ghost artifact, not
              // a screenshot fluke. will-change promotes this to its own
              // compositing layer so the repaint is clean. Left on
              // permanently rather than cleared post-animation — there are
              // only ever a handful of these on screen at once, so the
              // layer-promotion cost is negligible next to getting this
              // wrong again.
              willChange: "transform, opacity",
            }
      }
    >
      {children}
    </div>
  );
}
