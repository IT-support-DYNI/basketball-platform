"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up from 0 once scrolled into view — the `.stat-n` numbers in the
 *  stats strip. components/player/CountUp.tsx counts up immediately on
 *  mount instead of on visibility, which is wrong here (the stats section
 *  is well below the fold), so this is its own small component rather than
 *  a reuse. */
export default function StatCount({ value }: { value: number }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const dur = 1100;
          const step = (now: number) => {
            const p = Math.min(1, (now - t0) / dur);
            setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <p ref={ref} className="stat-n">
      {display}
    </p>
  );
}
