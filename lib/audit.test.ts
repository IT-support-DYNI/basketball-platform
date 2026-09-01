import { describe, it, expect } from "vitest";

import { auditActionLabel, AUDIT_ACTIONS } from "./audit";

describe("auditActionLabel", () => {
  it("has friendly phrasing for every known action", () => {
    for (const action of AUDIT_ACTIONS) {
      const label = auditActionLabel(action);
      expect(label).not.toBe("");
      expect(label).not.toContain("_");
      expect(label).toBe(label.toLowerCase());
    }
  });

  it("falls back to a humanised token for an unknown action", () => {
    expect(auditActionLabel("SOMETHING_NEW_HAPPENED")).toBe("something new happened");
  });
});
