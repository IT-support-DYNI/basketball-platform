import { describe, it, expect } from "vitest";

import { ageOn, isMinor } from "./age";

describe("ageOn", () => {
  const on = new Date("2026-09-01");
  it("counts whole years, respecting the birthday", () => {
    expect(ageOn(new Date("2010-09-01"), on)).toBe(16);
    expect(ageOn(new Date("2010-09-02"), on)).toBe(15); // birthday not yet reached
    expect(ageOn(new Date("2010-08-31"), on)).toBe(16);
  });
});

describe("isMinor", () => {
  const on = new Date("2026-09-01");
  it("uses the club threshold, not a hardcoded 18", () => {
    expect(isMinor(new Date("2009-01-01"), 18, on)).toBe(true); // 17
    expect(isMinor(new Date("2008-01-01"), 18, on)).toBe(false); // 18
    expect(isMinor(new Date("2009-01-01"), 16, on)).toBe(false); // 17, threshold 16
  });
});
