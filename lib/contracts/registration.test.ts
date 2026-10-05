import { describe, expect, it } from "vitest";

import { registerGuardianSchema, registerSchema } from "./registration";

const self = {
  name: "Test Player",
  email: "t@example.test",
  password: "abcdefgh1",
  teamId: 1,
  dateOfBirth: "1999-01-01",
  consentAccepted: true as const,
};

const guardian = {
  guardianName: "Test Guardian",
  guardianEmail: "g@example.test",
  guardianPassword: "abcdefgh1",
  relationshipLabel: "Parent",
  childName: "Test Child",
  childDateOfBirth: "2014-01-01",
  teamId: 1,
  consentAccepted: true as const,
};

describe("club history at registration", () => {
  it("is required — an unanswered question fails", () => {
    expect(registerSchema.safeParse(self).success).toBe(false);
    expect(registerGuardianSchema.safeParse(guardian).success).toBe(false);
  });

  it("accepts 'no previous club'", () => {
    expect(registerSchema.safeParse({ ...self, hasPreviousClub: false }).success).toBe(true);
    expect(registerGuardianSchema.safeParse({ ...guardian, hasPreviousClub: false }).success).toBe(true);
  });

  it("needs the club named when the answer is yes", () => {
    const missing = registerSchema.safeParse({ ...self, hasPreviousClub: true });
    expect(missing.success).toBe(false);
    if (!missing.success) expect(missing.error.flatten().fieldErrors.previousClubs).toBeDefined();

    expect(
      registerSchema.safeParse({ ...self, hasPreviousClub: true, previousClubs: "Belfast Star U14" }).success,
    ).toBe(true);
  });

  it("caps the club history length", () => {
    expect(
      registerSchema.safeParse({ ...self, hasPreviousClub: true, previousClubs: "x".repeat(301) }).success,
    ).toBe(false);
  });
});
