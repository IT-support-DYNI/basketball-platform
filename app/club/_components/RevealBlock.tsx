"use client";

import { createElement } from "react";
import { useReveal } from "./useReveal";

/** A generic `.rv` reveal wrapper for sections/blocks that don't also need
 *  TiltCard's pointer-tilt behaviour (section heads, stat tiles, gallery
 *  tiles, …) — same "apply the class to the real element, not a wrapper
 *  div" reasoning as useReveal's own doc comment. `as` picks the host tag
 *  (e.g. "figure" for gallery tiles, which need real <figcaption> semantics). */
export default function RevealBlock({
  as = "div",
  className = "",
  delayMs = 0,
  children,
}: {
  as?: "div" | "figure";
  className?: string;
  delayMs?: number;
  children?: React.ReactNode;
}) {
  const { ref, className: revealClassName, style } = useReveal(delayMs);
  return createElement(as, { ref, className: `${className} ${revealClassName}`.trim(), style }, children);
}
