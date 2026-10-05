/** Client-safe labels for the live scoreboard (no DB import). */

export type LiveStatus = "UPCOMING" | "LIVE" | "HALF_TIME" | "FINAL";

/** "Q3", "OT", "OT2", "Half time", "Full time" — the small status label. */
export function periodLabel(status: LiveStatus, period: number | null): string {
  if (status === "FINAL") return "Full time";
  if (status === "HALF_TIME") return "Half time";
  if (status === "UPCOMING") return "Not started";
  if (period == null) return "Live";
  if (period <= 4) return `Q${period}`;
  return period === 5 ? "OT" : `OT${period - 4}`;
}
