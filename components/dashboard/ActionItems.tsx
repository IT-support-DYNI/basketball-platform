import Link from "next/link";

import type { ActionItem } from "@/lib/action-items";
import { cn } from "@/lib/cn";

// Tone shows only in the left rail + hover wash. Text stays on the neutral ink
// scale so contrast holds in both themes (WCAG 2.1 AA).
const RAIL: Record<ActionItem["tone"], string> = {
  flame: "before:bg-flame",
  warning: "before:bg-warning",
  info: "before:bg-info",
};

/**
 * The "needs your attention" band. Renders nothing when the list is empty, so
 * a caught-up dashboard stays clean.
 */
export default function ActionItems({ items }: { items: ActionItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Needs your attention" className="flex flex-col gap-2">
      <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Needs your attention</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "relative flex items-center justify-between gap-3 overflow-hidden rounded-card border border-line bg-surface px-4 py-3 pl-5 transition hover:bg-surface-2",
              "before:absolute before:inset-y-0 before:left-0 before:w-1",
              RAIL[item.tone],
            )}
          >
            <span className="min-w-0">
              <span className="block font-condensed text-lg font-bold leading-none tabular text-ink">{item.label}</span>
              <span className="mt-1 block text-xs text-ink-dim">{item.detail}</span>
            </span>
            <span aria-hidden className="flex-none text-lg text-ink-dim">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
