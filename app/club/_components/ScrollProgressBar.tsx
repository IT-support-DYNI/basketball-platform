"use client";

import { useEffect, useRef } from "react";

/** The thin accent-gradient bar pinned to the very top of the viewport,
 *  tracking scroll position through the page. */
export default function ScrollProgressBar() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      el.style.width = `${h > 0 ? (window.scrollY / h) * 100 : 0}%`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div id="dyni-progress" ref={ref} aria-hidden="true" />;
}
