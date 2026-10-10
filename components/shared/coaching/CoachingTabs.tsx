"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const TABS = [
  { label: "Session plans", href: "/coach/training/plans" },
  { label: "Drills", href: "/coach/drills" },
  { label: "Plays", href: "/coach/plays" },
] as const;

/** Switches between the three parts of the coach's "Coaching" hub. Plain
 *  links (each is its own page), marked as the current page for screen readers. */
export default function CoachingTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Coaching" className="-mb-2 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((t) => {
        const current = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition",
              current ? "border-flame text-ink" : "border-transparent text-ink-dim hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
