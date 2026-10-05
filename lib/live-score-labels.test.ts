import { describe, expect, it } from "vitest";

import { periodLabel } from "./live-score-labels";

describe("periodLabel", () => {
  it("names the match state", () => {
    expect(periodLabel("UPCOMING", null)).toBe("Not started");
    expect(periodLabel("HALF_TIME", 2)).toBe("Half time");
    expect(periodLabel("FINAL", null)).toBe("Full time");
  });

  it("shows quarters, then overtime periods", () => {
    expect(periodLabel("LIVE", 1)).toBe("Q1");
    expect(periodLabel("LIVE", 4)).toBe("Q4");
    expect(periodLabel("LIVE", 5)).toBe("OT");
    expect(periodLabel("LIVE", 6)).toBe("OT2");
    expect(periodLabel("LIVE", null)).toBe("Live");
  });
});
