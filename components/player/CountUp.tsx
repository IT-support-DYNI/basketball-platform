"use client";

import { useEffect, useState } from "react";

/** Animates 0 → value once on mount. No-ops (renders the final value
 *  immediately) under prefers-reduced-motion.
 *
 *  No "only run once" ref guard here on purpose — React 18 Strict Mode
 *  (on by default in `next dev`) double-invokes effects (setup → cleanup →
 *  setup) specifically to catch effects that break under that. A ref guard
 *  combined with `cancelAnimationFrame` in cleanup means the first setup's
 *  frame gets cancelled and the second setup never starts a new one, so the
 *  animation silently never runs — it did exactly that here. Let the effect
 *  re-run cleanly instead; the cleanup cancelling an in-flight frame and a
 *  fresh `tick` loop starting is the correct, self-healing behaviour. */
export default function CountUp({
  value,
  decimals = 0,
  durationMs = 700,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  durationMs?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return (
    <>
      {display.toFixed(decimals)}
      {suffix}
    </>
  );
}
