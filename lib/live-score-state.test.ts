import { describe, it, expect } from "vitest";

import { updateScoreSchema } from "./contracts/event";
import { nextScoreState, type ScoreStatePatch } from "./live-score-state";

const patch = (current: Parameters<typeof nextScoreState>[0], body: unknown): ScoreStatePatch => {
  const r = nextScoreState(current, updateScoreSchema.parse(body));
  if (!r.ok) throw new Error(r.error);
  return r.patch;
};
const error = (current: Parameters<typeof nextScoreState>[0], body: unknown) => {
  const r = nextScoreState(current, updateScoreSchema.parse(body));
  return r.ok ? null : r.error;
};

describe("nextScoreState", () => {
  it.each([null, "UPCOMING"] as const)("a basket on an unstarted match (%s) starts it in Q1 from 0–0", (current) => {
    expect(patch(current, { addOur: 2 })).toEqual({
      liveStatus: "LIVE",
      period: 1,
      zeroNullScores: true,
      completeEvent: false,
      audit: "STATUS_CHANGED",
    });
  });

  it("Start match honours a chosen quarter", () => {
    expect(patch("UPCOMING", { liveStatus: "LIVE", period: 3 }).period).toBe(3);
  });

  it.each(["LIVE", "HALF_TIME"] as const)("a basket while %s changes nothing but the score", (current) => {
    expect(patch(current, { addOpponent: 3 })).toEqual({
      zeroNullScores: false,
      completeEvent: false,
      audit: null,
    });
  });

  it("an explicit status wins over the auto-start", () => {
    expect(patch("UPCOMING", { liveStatus: "UPCOMING", ourScore: 4 }).liveStatus).toBe("UPCOMING");
  });

  it("half time keeps the quarter; second half sets it", () => {
    expect(patch("LIVE", { liveStatus: "HALF_TIME" })).not.toHaveProperty("period");
    expect(patch("HALF_TIME", { liveStatus: "LIVE", period: 3 })).toMatchObject({ liveStatus: "LIVE", period: 3 });
  });

  it("full time clears the quarter, completes the event and is audited", () => {
    expect(patch("LIVE", { liveStatus: "FINAL" })).toEqual({
      liveStatus: "FINAL",
      period: null,
      zeroNullScores: false,
      completeEvent: true,
      audit: "STATUS_CHANGED",
    });
  });

  it("jumping straight from not started to full time still sets null scores to 0", () => {
    expect(patch(null, { liveStatus: "FINAL" })).toMatchObject({ liveStatus: "FINAL", zeroNullScores: true, completeEvent: true });
    expect(patch("UPCOMING", { liveStatus: "UPCOMING" }).zeroNullScores).toBe(false);
  });

  it("going back to UPCOMING clears the quarter", () => {
    expect(patch("LIVE", { liveStatus: "UPCOMING" }).period).toBeNull();
  });

  it("a finished match can't go back to live or half time", () => {
    expect(error("FINAL", { liveStatus: "LIVE" })).toMatch(/can't go back to live/);
    expect(error("FINAL", { liveStatus: "HALF_TIME" })).toMatch(/can't go back to live/);
  });

  it("correcting a finished match's score keeps it FINAL and is always audited", () => {
    expect(patch("FINAL", { ourScore: 61 })).toEqual({
      zeroNullScores: false,
      completeEvent: false,
      audit: "CORRECTED",
    });
    expect(patch("FINAL", { addOpponent: -1 }).audit).toBe("CORRECTED");
    expect(patch("FINAL", { opponentName: "Belfast Star" }).audit).toBe("CORRECTED");
  });

  it("re-sending FINAL on a finished match is not a status change", () => {
    expect(patch("FINAL", { liveStatus: "FINAL" }).audit).toBeNull();
  });

  it("rejects a quarter when the match isn't in play", () => {
    expect(error("UPCOMING", { period: 2 })).toMatch(/only be set while the match is in play/);
    expect(error("FINAL", { period: 2 })).toMatch(/in play/);
    expect(error("LIVE", { liveStatus: "FINAL", period: 4 })).toMatch(/in play/);
  });

  it("allows changing the quarter mid-match without other effects", () => {
    expect(patch("LIVE", { period: 4 })).toEqual({ period: 4, zeroNullScores: false, completeEvent: false, audit: null });
  });
});

describe("updateScoreSchema", () => {
  it.each([
    [{}, "an empty body"],
    [{ ourScore: 3, addOur: 1 }, "absolute and increment for the same side"],
    [{ addOur: 0 }, "a zero step"],
    [{ addOur: 4 }, "a step above 3"],
    [{ ourScore: -1 }, "a negative score"],
    [{ ourScore: 301 }, "a score above 300"],
    [{ ourScore: 2.5 }, "a fractional score"],
    [{ period: 0 }, "quarter 0"],
    [{ period: 11 }, "quarter 11"],
    [{ liveStatus: "PAUSED" }, "an unknown status"],
  ] as [unknown, string][])("rejects %j (%s)", (body) => {
    expect(updateScoreSchema.safeParse(body).success).toBe(false);
  });

  it("turns a blank opponent name into null", () => {
    expect(updateScoreSchema.parse({ opponentName: "   " }).opponentName).toBeNull();
  });

  it("allows an increment on one side with an absolute value on the other", () => {
    expect(updateScoreSchema.safeParse({ addOur: 2, opponentScore: 40 }).success).toBe(true);
  });
});
