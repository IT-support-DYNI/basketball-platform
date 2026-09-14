import Link from "next/link";
import type { ReactNode } from "react";

/** Canonical accents plus legacy aliases kept so pages not yet migrated to the
 *  DYNI system keep working. New code should use the canonical names. */
type Accent =
  | "flame"
  | "ember"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  // legacy
  | "orange"
  | "sky"
  | "violet"
  | "amber"
  | "rose"
  | "slate"
  | "emerald";

const ACCENT_TEXT: Record<Accent, string> = {
  flame: "text-flame-ink",
  ember: "text-ember",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-ink",
  orange: "text-flame-ink",
  sky: "text-info",
  violet: "text-info",
  amber: "text-warning",
  rose: "text-danger",
  slate: "text-ink",
  emerald: "text-success",
};

/** Hover border matches each tile's own accent, not one fixed colour — a
 *  green attendance card's border goes green, a blue performance card's
 *  goes blue. Flat (no glow shadow, no lift) — the wireframe pass dropped
 *  soft-shadow elevation everywhere in favour of the border-colour cue. */
const ACCENT_HOVER: Record<Accent, string> = {
  flame: "hover:border-flame",
  ember: "hover:border-ember",
  info: "hover:border-info",
  success: "hover:border-success",
  warning: "hover:border-warning",
  danger: "hover:border-danger",
  neutral: "hover:border-line-strong",
  orange: "hover:border-flame",
  sky: "hover:border-info",
  violet: "hover:border-info",
  amber: "hover:border-warning",
  rose: "hover:border-danger",
  slate: "hover:border-line-strong",
  emerald: "hover:border-success",
};

type Props = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: Accent;
  href?: string;
  /** @deprecated emoji icons are being removed from the DYNI design */
  icon?: string;
};

/** Dashboard KPI tile: big value, small label, optional link + sub-line. */
export default function StatTile({ label, value, sub, accent = "neutral", href }: Props) {
  const content = (
    <div
      className={`h-full rounded-card border border-line bg-surface p-4 transition duration-200 ${ACCENT_HOVER[accent]}`}
    >
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className={`mt-1.5 font-condensed text-3xl font-bold leading-none tabular ${ACCENT_TEXT[accent]}`}>
        {value}
      </p>
      {/* div, not p — `sub` can carry block content (ProgressBar, Sparkline),
          which a <p> can't legally contain (React 19 will warn on nesting
          block elements in a <p> and hydration mismatches on it). */}
      {sub && <div className="mt-1.5 text-xs text-ink-dim">{sub}</div>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
