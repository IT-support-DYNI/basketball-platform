"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useReveal } from "./useReveal";

/** A `.rv` (scroll-reveal) card that also tilts toward the cursor on
 *  pointermove — desktop + fine-pointer only, gated by prefers-reduced-motion,
 *  matching the original vanilla-JS `.tilt` behaviour. Renders a Link when
 *  `href` is given, a plain div otherwise (coach cards aren't links). */
export default function TiltCard({
  href,
  className,
  delayMs = 0,
  children,
}: {
  href?: string;
  className: string;
  delayMs?: number;
  children: React.ReactNode;
}) {
  const { ref, className: revealClassName, style } = useReveal(delayMs);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.style.transition = "transform 200ms cubic-bezier(0.16,1,0.3,1), border-color 260ms, box-shadow 260ms";
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref]);

  const combined = `${className} ${revealClassName} tilt`;

  if (href) {
    return (
      <Link href={href} ref={ref as React.Ref<HTMLAnchorElement>} className={combined} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={combined} style={style}>
      {children}
    </div>
  );
}
