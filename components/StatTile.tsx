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

/** Hover glow matches each tile's own accent, not one fixed colour — a green
 *  attendance card glows green, a blue performance card glows blue. */
const ACCENT_HOVER: Record<Accent, string> = {
  flame: "hover:border-flame/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--flame)/0.45)]",
  ember: "hover:border-ember/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--ember)/0.45)]",
  info: "hover:border-info/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--info)/0.45)]",
  success: "hover:border-success/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--success)/0.45)]",
  warning: "hover:border-warning/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--warning)/0.45)]",
  danger: "hover:border-danger/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--danger)/0.45)]",
  neutral: "hover:border-line-strong",
  orange: "hover:border-flame/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--flame)/0.45)]",
  sky: "hover:border-info/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--info)/0.45)]",
  violet: "hover:border-info/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--info)/0.45)]",
  amber: "hover:border-warning/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--warning)/0.45)]",
  rose: "hover:border-danger/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--danger)/0.45)]",
  slate: "hover:border-line-strong",
  emerald: "hover:border-success/50 hover:shadow-[0_12px_30px_-10px_rgb(var(--success)/0.45)]",
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
      className={`h-full rounded-card border border-line bg-surface p-4 transition duration-200 hover:-translate-y-1 ${ACCENT_HOVER[accent]}`}
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
