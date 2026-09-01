/**
 * Colour + text status pill. Colour is never the only signal — the label is
 * always present. Hues come from the theme's semantic tokens (defined in
 * app/globals.css) so contrast holds in both light and dark (WCAG 2.1 AA).
 */
type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const STATUS_TONE: Record<string, Tone> = {
  // membership
  ACTIVE: "success",
  PENDING: "warning",
  INJURED: "danger",
  SUSPENDED: "neutral",
  INACTIVE: "neutral",
  TRIALIST: "info",
  FORMER: "neutral",
  // events
  SCHEDULED: "info",
  CONFIRMED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  POSTPONED: "warning",
  // attendance
  PRESENT: "success",
  ABSENT: "danger",
  LATE: "warning",
  EXCUSED: "neutral",
  // registration
  APPROVED: "success",
  REJECTED: "danger",
  CHANGES_REQUESTED: "info",
  // teams
  ARCHIVED: "neutral",
};

const TONE_VAR: Record<Tone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
  neutral: "var(--ink-dim)",
};

export default function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status.toUpperCase()] ?? "neutral";
  const color = `rgb(${TONE_VAR[tone]})`;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide"
      style={{
        color,
        borderColor: `rgb(${TONE_VAR[tone]} / 0.45)`,
        backgroundColor: `rgb(${TONE_VAR[tone]} / 0.12)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {status.replace(/_/g, " ")}
    </span>
  );
}
