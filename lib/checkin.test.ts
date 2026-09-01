import { describe, it, expect } from "vitest";

import { verifyPin, statusFromCheckIn } from "./checkin";

describe("verifyPin", () => {
  it("matches an exact PIN", () => {
    expect(verifyPin("4827", "4827")).toBe(true);
  });
  it("rejects a wrong or wrong-length PIN", () => {
    expect(verifyPin("4827", "4828")).toBe(false);
    expect(verifyPin("4827", "482")).toBe(false);
    expect(verifyPin("4827", "48270")).toBe(false);
  });
  it("rejects when the venue has no PIN", () => {
    expect(verifyPin(null, "4827")).toBe(false);
    expect(verifyPin(undefined, "")).toBe(false);
  });
});

describe("statusFromCheckIn", () => {
  const start = new Date("2026-09-01T18:00:00");
  it("PRESENT when on time or within the 10-min grace", () => {
    expect(statusFromCheckIn(new Date("2026-09-01T17:55:00"), start)).toBe("PRESENT");
    expect(statusFromCheckIn(new Date("2026-09-01T18:09:00"), start)).toBe("PRESENT");
  });
  it("LATE once past the grace window", () => {
    expect(statusFromCheckIn(new Date("2026-09-01T18:11:00"), start)).toBe("LATE");
  });
});
