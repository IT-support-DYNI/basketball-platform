import type { RecurrenceFrequency } from "@prisma/client";

/**
 * RRULE-lite expansion. A recurring event is stored as an `EventRecurrence`
 * rule plus one concrete `Event` row per occurrence (materialised at creation),
 * so editing or cancelling a single occurrence only touches that row.
 */

export type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  interval: number;
  /** 0=Sun … 6=Sat. WEEKLY only; empty = the first occurrence's own weekday. */
  byWeekday: number[];
  until: Date | null;
  count: number | null;
};

/** Hard ceiling so a bad rule can't create thousands of rows. */
export const MAX_OCCURRENCES = 260;
/** When neither `until` nor `count` is given, stop this far past the first one. */
const DEFAULT_HORIZON_DAYS = 366;

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  const day = r.getDate();
  r.setDate(1);
  r.setMonth(r.getMonth() + n);
  // Clamp to the last day of the target month (e.g. Jan 31 + 1mo → Feb 28).
  const lastDay = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(day, lastDay));
  return r;
}

/** With the time-of-day of `time` but the calendar date of `date`. */
function withTimeOf(date: Date, time: Date): Date {
  const r = new Date(date);
  r.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
  return r;
}

/**
 * Expand a rule into `{ startAt, endAt }` pairs, the first being `firstStart` /
 * `firstEnd`. Bounded by `count`, `until`, MAX_OCCURRENCES, and a default
 * one-year horizon.
 */
export function expandOccurrences(
  rule: RecurrenceRule,
  firstStart: Date,
  firstEnd: Date,
): { startAt: Date; endAt: Date }[] {
  const durationMs = firstEnd.getTime() - firstStart.getTime();
  const interval = Math.max(1, Math.floor(rule.interval || 1));
  const horizon = rule.until ?? addDays(firstStart, DEFAULT_HORIZON_DAYS);
  const limit = rule.count != null ? Math.min(rule.count, MAX_OCCURRENCES) : MAX_OCCURRENCES;

  const starts: Date[] = [];
  const push = (d: Date) => {
    if (starts.length < limit && d <= horizon) starts.push(d);
  };

  if (rule.frequency === "WEEKLY") {
    const weekdays = (rule.byWeekday.length ? rule.byWeekday : [firstStart.getDay()])
      .filter((n) => n >= 0 && n <= 6)
      .sort((a, b) => a - b);
    // Anchor to the Sunday of the first occurrence's week.
    let weekStart = addDays(firstStart, -firstStart.getDay());
    let guard = 0;
    while (starts.length < limit && guard++ < MAX_OCCURRENCES * 2) {
      for (const wd of weekdays) {
        const day = withTimeOf(addDays(weekStart, wd), firstStart);
        if (day >= firstStart) push(day);
      }
      if (starts.length === 0 && weekStart > horizon) break;
      weekStart = addDays(weekStart, 7 * interval);
      if (weekStart > horizon) break;
    }
  } else if (rule.frequency === "DAILY") {
    let d = new Date(firstStart);
    while (starts.length < limit && d <= horizon) {
      push(d);
      d = withTimeOf(addDays(d, interval), firstStart);
    }
  } else {
    // MONTHLY
    let d = new Date(firstStart);
    let i = 0;
    while (starts.length < limit && d <= horizon && i++ < MAX_OCCURRENCES * 2) {
      push(d);
      d = withTimeOf(addMonths(firstStart, interval * i), firstStart);
    }
  }

  // De-dupe + order, then attach the shared duration.
  const seen = new Set<number>();
  return starts
    .filter((d) => (seen.has(d.getTime()) ? false : (seen.add(d.getTime()), true)))
    .sort((a, b) => a.getTime() - b.getTime())
    .slice(0, limit)
    .map((startAt) => ({ startAt, endAt: new Date(startAt.getTime() + durationMs) }));
}

/** Human summary of a rule, e.g. "Weekly on Tue, Thu". */
export function describeRule(rule: RecurrenceRule): string {
  const every = rule.interval > 1 ? `Every ${rule.interval} ` : "";
  if (rule.frequency === "DAILY") return `${every || "Every "}day${rule.interval > 1 ? "s" : ""}`;
  if (rule.frequency === "MONTHLY") return `${every || "Every "}month${rule.interval > 1 ? "s" : ""}`;
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = rule.byWeekday.length ? rule.byWeekday.map((n) => names[n]).join(", ") : "";
  return `${every ? `Every ${rule.interval} weeks` : "Weekly"}${days ? ` on ${days}` : ""}`;
}
