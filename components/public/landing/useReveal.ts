"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The `.rv` / `.rv.in` reveal-on-scroll pattern from styles/dyni-landing —
 * a hook rather than a wrapper component (unlike components/player/
 * ScrollReveal.tsx) because this design's CSS expects `.rv` on the actual
 * card/section element itself (sharing a class list with `.team`, `.coach`,
 * `.head`, …), not on an extra wrapper div — wrapping would break every
 * `position:absolute` child that assumes its `position:relative` parent IS
 * the revealed element.
 */
export function useReveal(delayMs = 0) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSkip(true);
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
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return {
    ref,
    className: `rv${visible ? " in" : ""}`,
    style: skip ? undefined : ({ "--d": `${delayMs}ms` } as React.CSSProperties),
  };
}
