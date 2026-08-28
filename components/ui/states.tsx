import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { ButtonLink } from "./Button";

/* -------------------------------------------------------------------------- */
/*  Skeleton + LoadingState                                                    */
/* -------------------------------------------------------------------------- */

/** A single shimmering placeholder block. Compose these to match the shape of
 *  the content being loaded, rather than using a generic spinner. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-3", className)}
      aria-hidden="true"
    />
  );
}

/** Card-shaped loading placeholder — the default when a page section is
 *  fetching. Pass `rows` to size it. */
export function LoadingState({ rows = 3, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5" role="status" aria-live="polite">
      <span className="sr-only">{label}…</span>
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3.5", i === rows - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EmptyState                                                                 */
/* -------------------------------------------------------------------------- */

/** Shown where a list is legitimately empty — this is not an error. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-faint">{icon}</div>}
      <p className="font-display text-sm font-bold uppercase tracking-wide text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-dim">{description}</p>}
      {action && (
        <ButtonLink href={action.href} variant="secondary" size="sm" className="mt-4">
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ErrorState + PermissionDenied                                              */
/* -------------------------------------------------------------------------- */

/** Recoverable error. Never render a raw stack trace here. */
export function ErrorState({
  title = "Something went wrong",
  description = "This didn't load. Try again, and if it keeps happening let the club know.",
  onRetry,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-danger/40 bg-danger/5 px-6 py-10 text-center">
      <p className="font-display text-sm font-bold uppercase tracking-wide text-danger">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-ink-dim">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** The 403 surface — a clean message, not a broken page. */
export function PermissionDenied({
  description = "You don't have access to this. If you think you should, ask a club administrator.",
}: {
  description?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <p className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
        No access
      </p>
      <p className="mt-2 text-ink-dim">{description}</p>
      <ButtonLink href="/" variant="secondary" className="mt-6">
        Back to home
      </ButtonLink>
    </div>
  );
}
