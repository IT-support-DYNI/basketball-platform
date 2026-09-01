import { describe, it, expect } from "vitest";

import {
  canDeleteOwnAccount,
  anonymisedUserFields,
  anonymisedPlayerProfileFields,
} from "./account";

describe("canDeleteOwnAccount", () => {
  it("blocks the last active administrator", () => {
    expect(canDeleteOwnAccount("ADMIN", 1)).toEqual({
      ok: false,
      reason: expect.stringContaining("only active administrator"),
    });
  });

  it("allows an admin when another admin remains", () => {
    expect(canDeleteOwnAccount("ADMIN", 2)).toEqual({ ok: true });
  });

  it("never blocks non-admins", () => {
    expect(canDeleteOwnAccount("PLAYER", 1)).toEqual({ ok: true });
    expect(canDeleteOwnAccount("COACH", 1)).toEqual({ ok: true });
    expect(canDeleteOwnAccount("GUARDIAN", 0)).toEqual({ ok: true });
  });
});

describe("anonymisedUserFields", () => {
  it("clears credentials and identity, keyed by id", () => {
    const f = anonymisedUserFields(42);
    expect(f.email).toBe("deleted-42@deleted.invalid");
    expect(f.name).toBe("Former member");
    expect(f.passwordHash).toBeNull();
    expect(f.isActive).toBe(false);
    expect(f.calendarToken).toBeNull();
  });
});

describe("anonymisedPlayerProfileFields", () => {
  it("nulls every personal-data column", () => {
    const f = anonymisedPlayerProfileFields();
    for (const key of [
      "dateOfBirth",
      "contactPhone",
      "address",
      "guardianName",
      "guardianContact",
      "emergencyContactName",
      "emergencyContactPhone",
      "emergencyContactRelation",
      "medicalNotes",
      "welfareNotes",
      "bio",
      "nationality",
      "photoUrl",
      "heightCm",
    ]) {
      expect(f).toHaveProperty(key, null);
    }
    expect(f.publicProfileApproved).toBe(false);
  });
});
