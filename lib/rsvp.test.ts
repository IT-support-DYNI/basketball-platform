import { describe, it, expect } from "vitest";

import { rsvpWindowState, capacityState, tallyResponses } from "./rsvp";

const ev = (over: Partial<Parameters<typeof rsvpWindowState>[0]> = {}) => ({
  status: "SCHEDULED",
  startAt: new Date(Date.now() + 3 * 864e5),
  endAt: new Date(Date.now() + 3 * 864e5 + 2 * 3600e3),
  rsvpDeadline: null,
  capacity: null,
  ...over,
});

describe("rsvpWindowState", () => {
  it("open for a future scheduled event", () => {
    expect(rsvpWindowState(ev()).open).toBe(true);
  });
  it("closed once the event has ended", () => {
    const r = rsvpWindowState(ev({ startAt: new Date(Date.now() - 2 * 864e5), endAt: new Date(Date.now() - 864e5) }));
    expect(r.open).toBe(false);
    expect(r.reason).toMatch(/already taken place/);
  });
  it("closed after the deadline", () => {
    expect(rsvpWindowState(ev({ rsvpDeadline: new Date(Date.now() - 3600e3) })).open).toBe(false);
  });
  it("closed for a cancelled event", () => {
    expect(rsvpWindowState(ev({ status: "CANCELLED" })).open).toBe(false);
  });
});

describe("capacityState", () => {
  it("unlimited when capacity is null", () => {
    expect(capacityState(ev(), 99)).toEqual({ limited: false, full: false, remaining: null });
  });
  it("counts remaining and detects full", () => {
    expect(capacityState(ev({ capacity: 10 }), 7)).toEqual({ limited: true, full: false, remaining: 3 });
    expect(capacityState(ev({ capacity: 10 }), 10)).toEqual({ limited: true, full: true, remaining: 0 });
    expect(capacityState(ev({ capacity: 10 }), 12).remaining).toBe(0);
  });
});

describe("tallyResponses", () => {
  it("buckets responses and computes non-responders", () => {
    const t = tallyResponses(
      [{ response: "ATTENDING" }, { response: "ATTENDING" }, { response: "UNSURE" }, { response: "NOT_ATTENDING" }],
      10,
    );
    expect(t).toEqual({ attending: 2, notAttending: 1, unsure: 1, noResponse: 6 });
  });
});
