import { describe, it, expect } from "vitest";

import { expandOccurrences, describeRule, MAX_OCCURRENCES, type RecurrenceRule } from "./recurrence";

const rule = (over: Partial<RecurrenceRule>): RecurrenceRule => ({
  frequency: "WEEKLY",
  interval: 1,
  byWeekday: [],
  until: null,
  count: null,
  ...over,
});

const start = new Date("2026-09-01T18:00:00"); // a Tuesday
const end = new Date("2026-09-01T20:00:00");

describe("expandOccurrences", () => {
  it("weekly, count 4 → 4 Tuesdays, one week apart, 2h each", () => {
    const occ = expandOccurrences(rule({ count: 4 }), start, end);
    expect(occ).toHaveLength(4);
    expect(occ[0].startAt.getTime()).toBe(start.getTime());
    expect(occ[1].startAt.getTime() - occ[0].startAt.getTime()).toBe(7 * 864e5);
    expect(occ[0].endAt.getTime() - occ[0].startAt.getTime()).toBe(2 * 3600e3);
    for (const o of occ) expect(o.startAt.getDay()).toBe(2);
  });

  it("weekly on Tue + Thu → interleaved, first is the seed", () => {
    const occ = expandOccurrences(rule({ byWeekday: [2, 4], count: 4 }), start, end);
    expect(occ.map((o) => o.startAt.getDay())).toEqual([2, 4, 2, 4]);
    expect(occ[0].startAt.getTime()).toBe(start.getTime());
  });

  it("every 2 weeks → 14-day gap", () => {
    const occ = expandOccurrences(rule({ interval: 2, count: 3 }), start, end);
    expect(occ[1].startAt.getTime() - occ[0].startAt.getTime()).toBe(14 * 864e5);
  });

  it("`until` stops the series", () => {
    const occ = expandOccurrences(rule({ until: new Date("2026-09-20T00:00:00") }), start, end);
    expect(occ).toHaveLength(3); // Sep 1, 8, 15
  });

  it("daily, count 3", () => {
    const occ = expandOccurrences(rule({ frequency: "DAILY", count: 3 }), start, end);
    expect(occ).toHaveLength(3);
    expect(occ[2].startAt.getDate()).toBe(3);
  });

  it("monthly clamps to the last valid day", () => {
    const jan31 = new Date("2026-01-31T10:00:00");
    const occ = expandOccurrences(rule({ frequency: "MONTHLY", count: 3 }), jan31, jan31);
    expect(occ[1].startAt.getMonth()).toBe(1); // Feb
    expect(occ[1].startAt.getDate()).toBe(28);
  });

  it("never exceeds MAX_OCCURRENCES even with a huge count", () => {
    const occ = expandOccurrences(rule({ frequency: "DAILY", count: 100000, until: new Date("2099-01-01") }), start, end);
    expect(occ.length).toBeLessThanOrEqual(MAX_OCCURRENCES);
  });

  it("bare rule (no count/until) is capped at ~1 year", () => {
    const occ = expandOccurrences(rule({}), start, end);
    expect(occ.length).toBeLessThanOrEqual(53);
    expect(occ.length).toBeGreaterThan(50);
  });
});

describe("describeRule", () => {
  it("weekly with days", () => {
    expect(describeRule(rule({ byWeekday: [2, 4] }))).toBe("Weekly on Tue, Thu");
  });
  it("every N weeks", () => {
    expect(describeRule(rule({ interval: 2, byWeekday: [1] }))).toBe("Every 2 weeks on Mon");
  });
  it("daily / monthly", () => {
    expect(describeRule(rule({ frequency: "DAILY" }))).toBe("Every day");
    expect(describeRule(rule({ frequency: "MONTHLY", interval: 3 }))).toBe("Every 3 months");
  });
});
