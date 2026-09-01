import { describe, it, expect } from "vitest";

import { computeLockout, hashIp, MAX_FAILURES, WINDOW_MINUTES } from "./login-throttle";

const now = new Date("2026-09-15T12:00:00Z");
const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000);
const fail = (m: number) => ({ success: false, createdAt: minsAgo(m) });
const ok = (m: number) => ({ success: true, createdAt: minsAgo(m) });

describe("computeLockout", () => {
  it("is unlocked below the threshold", () => {
    const attempts = Array.from({ length: MAX_FAILURES - 1 }, (_, i) => fail(i));
    expect(computeLockout(attempts, now)).toEqual({ locked: false, retryAfterMinutes: 0 });
  });

  it("locks at the threshold and reports a retry window", () => {
    // 5 failures, the oldest 10 minutes ago → unlocks 5 minutes from now
    const attempts = [fail(1), fail(3), fail(5), fail(7), fail(10)];
    const state = computeLockout(attempts, now);
    expect(state.locked).toBe(true);
    expect(state.retryAfterMinutes).toBe(WINDOW_MINUTES - 10);
  });

  it("a success resets the failure count", () => {
    const attempts = [fail(1), fail(2), ok(3), fail(4), fail(5), fail(6), fail(7)];
    // only 2 failures since the most recent success
    expect(computeLockout(attempts, now).locked).toBe(false);
  });

  it("stays locked while failures keep coming", () => {
    const attempts = [fail(0), fail(1), fail(2), fail(3), fail(4), fail(14)];
    expect(computeLockout(attempts, now).locked).toBe(true);
  });

  it("empty history is never locked", () => {
    expect(computeLockout([], now)).toEqual({ locked: false, retryAfterMinutes: 0 });
  });
});

describe("hashIp", () => {
  it("hashes, truncates, and passes through null", () => {
    expect(hashIp(null)).toBeNull();
    expect(hashIp("")).toBeNull();
    const h = hashIp("203.0.113.7");
    expect(h).toHaveLength(32);
    expect(h).not.toContain("203");
    expect(hashIp("203.0.113.7")).toBe(h); // deterministic
  });
});
