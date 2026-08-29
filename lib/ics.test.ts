import { describe, it, expect } from "vitest";

import { buildCalendar, type IcsEvent } from "./ics";

const base: IcsEvent = {
  id: 7,
  type: "TRAINING",
  title: "Tuesday Practice",
  description: null,
  startAt: new Date("2026-09-01T17:00:00Z"),
  endAt: new Date("2026-09-01T19:00:00Z"),
  status: "SCHEDULED",
  venue: { name: "Community Sports Centre", address: "12 Riverside Way" },
  updatedAt: new Date("2026-08-20T10:00:00Z"),
};

describe("buildCalendar", () => {
  it("wraps events in a VCALENDAR with CRLF lines", () => {
    const ics = buildCalendar([base], "My schedule");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("\r\n");
  });

  it("emits UTC DTSTART/DTEND and a stable UID", () => {
    const ics = buildCalendar([base], "s");
    expect(ics).toContain("DTSTART:20260901T170000Z");
    expect(ics).toContain("DTEND:20260901T190000Z");
    expect(ics).toContain("UID:event-7@dyniblazers");
    expect(ics).toContain("LOCATION:Community Sports Centre\\, 12 Riverside Way");
  });

  it("marks cancelled events CANCELLED", () => {
    const ics = buildCalendar([{ ...base, status: "CANCELLED" }], "s");
    expect(ics).toContain("STATUS:CANCELLED");
  });

  it("escapes commas/semicolons in text", () => {
    const ics = buildCalendar([{ ...base, title: "A, B; C" }], "s");
    expect(ics).toContain("SUMMARY:A\\, B\\; C");
  });

  it("folds long lines at 75 octets", () => {
    const ics = buildCalendar([{ ...base, title: "x".repeat(200) }], "s");
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
  });
});
