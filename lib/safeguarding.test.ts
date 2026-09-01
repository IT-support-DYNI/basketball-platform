import { describe, it, expect } from "vitest";

import { directMessageAllowed, type SafeguardingPolicy } from "./safeguarding";

const strict: SafeguardingPolicy = {
  blockAdultMinorDirectMessages: true,
  guardianAutoIncludedWithMinor: true,
  minorAgeThreshold: 18,
};

describe("directMessageAllowed", () => {
  it("blocks an adult ↔ minor 1:1", () => {
    expect(directMessageAllowed([false, true], strict)).toBe(false);
    expect(directMessageAllowed([true, false], strict)).toBe(false);
  });

  it("allows adult ↔ adult and minor ↔ minor", () => {
    expect(directMessageAllowed([false, false], strict)).toBe(true);
    expect(directMessageAllowed([true, true], strict)).toBe(true);
  });

  it("does nothing for non-pairs (group conversations are handled elsewhere)", () => {
    expect(directMessageAllowed([false, true, true], strict)).toBe(true);
  });

  it("respects a club that has turned the block off", () => {
    expect(directMessageAllowed([false, true], { ...strict, blockAdultMinorDirectMessages: false })).toBe(true);
  });
});
