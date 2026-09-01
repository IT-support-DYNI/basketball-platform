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

type Props = {
  label: string;
  value: string | number;
  sub?: ReactNode;
  accent?: Accent;
  href?: string;
  /** @deprecated emoji icons are being removed from the DYNI design */
  icon?: string;
};

/** Dashboard KPI tile: big value, small label, optional link + sub-line. */
export default function StatTile({ label, value, sub, accent = "neutral", href }: Props) {
  const content = (
    <div className="h-full rounded-card border border-line bg-surface p-4 transition hover:border-line-strong">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className={`mt-1.5 font-condensed text-3xl font-bold leading-none tabular ${ACCENT_TEXT[accent]}`}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-ink-dim">{sub}</p>}
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
