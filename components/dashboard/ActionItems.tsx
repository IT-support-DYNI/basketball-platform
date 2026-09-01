import Link from "next/link";

import type { ActionItem } from "@/lib/action-items";
import { cn } from "@/lib/cn";

const TONE: Record<ActionItem["tone"], string> = {
  flame: "border-flame/40 bg-flame/10 text-flame-ink hover:bg-flame/15",
  warning: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/15",
  info: "border-info/40 bg-info/10 text-info hover:bg-info/15",
};

/**
 * The "needs your attention" band. Renders nothing when the list is empty, so
 * a caught-up dashboard stays clean.
 */
export default function ActionItems({ items }: { items: ActionItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Needs your attention" className="flex flex-col gap-2">
      <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Needs your attention</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex items-center justify-between gap-3 rounded-card border px-4 py-3 transition",
              TONE[item.tone],
            )}
          >
            <span className="min-w-0">
              <span className="block font-condensed text-lg font-bold leading-none tabular">{item.label}</span>
              <span className="mt-1 block text-xs opacity-80">{item.detail}</span>
            </span>
            <span aria-hidden className="flex-none text-lg">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
