import { describe, it, expect } from "vitest";
import type { Session } from "next-auth";

import { visibleEventScope, parseRange, EVENT_TYPE_LABEL, isDeadline } from "./events";

function sess(over: Partial<Session["user"]>): Session {
  return { user: { id: "1", name: "T", email: "t@e.com", role: "PLAYER", isActive: true, ...over }, expires: "" } as Session;
}

describe("visibleEventScope", () => {
  it("admins see everything", () => {
    expect(visibleEventScope(sess({ role: "ADMIN" }))).toEqual({});
  });

  it("a coach sees their teams' events plus club-wide", () => {
    const w = visibleEventScope(sess({ role: "COACH", teamIds: [3, 4] }));
    expect(w).toEqual({ OR: [{ teamId: null }, { teamId: { in: [3, 4] } }] });
  });

  it("a player with no team still sees club-wide events", () => {
    const w = visibleEventScope(sess({ role: "PLAYER" }));
    expect(w).toEqual({ OR: [{ teamId: null }, { teamId: { in: [] } }] });
  });
});

describe("parseRange", () => {
  it("uses the given from/to", () => {
    const r = parseRange(new URLSearchParams({ from: "2026-01-01T00:00:00Z", to: "2026-02-01T00:00:00Z" }));
    expect(r.gte.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(r.lte.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("defaults to a window spanning now", () => {
    const r = parseRange(new URLSearchParams());
    expect(r.gte.getTime()).toBeLessThan(Date.now());
    expect(r.lte.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("misc", () => {
  it("labels every event type", () => {
    expect(EVENT_TYPE_LABEL.TRAINING).toBe("Training");
    expect(EVENT_TYPE_LABEL.REGISTRATION_DEADLINE).toBe("Registration deadline");
  });

  it("isDeadline is true when start === end", () => {
    const t = new Date("2026-05-01T12:00:00Z");
    expect(isDeadline({ startAt: t, endAt: t })).toBe(true);
    expect(isDeadline({ startAt: t, endAt: new Date(t.getTime() + 1) })).toBe(false);
  });
});
