import type { ReactNode } from "react";

import Brandmark from "@/components/Brandmark";
import ThemeToggle from "@/components/theme/ThemeToggle";

/**
 * Full-height frame for the unauthenticated screens (sign in, register, status,
 * set password). Dark court-line backdrop, crest, theme toggle from the first
 * screen — matches wireframe 19.1.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  width = "md",
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg";
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <CourtBackdrop />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className={`relative z-10 w-full ${width === "lg" ? "max-w-xl" : "max-w-md"}`}>
        <div className="mb-6 flex justify-center">
          <Brandmark size="lg" wordmark={false} />
        </div>

        <div className="rounded-card border border-line bg-surface/95 p-7 shadow-pop backdrop-blur">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-dim">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-ink-dim">{footer}</div>}
      </div>
    </main>
  );
}

function CourtBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-[0.15]"
      viewBox="0 0 1200 800"
      fill="none"
      aria-hidden="true"
    >
      <rect x="20" y="20" width="1160" height="760" rx="8" stroke="var(--flame)" />
      <circle cx="600" cy="400" r="110" stroke="var(--flame)" />
      <line x1="600" y1="20" x2="600" y2="780" stroke="var(--flame)" />
      <path d="M20 220 A 320 320 0 0 1 20 580" stroke="var(--flame)" />
      <path d="M1180 220 A 320 320 0 0 0 1180 580" stroke="var(--flame)" />
    </svg>
  );
}
