import { describe, it, expect } from "vitest";

import {
  CATEGORY_FOR_TYPE,
  CATEGORY_LABEL,
  NOTIFICATION_CATEGORIES,
  CATEGORY_DEFAULTS,
} from "./notification-categories";

describe("notification categories", () => {
  it("maps every notification type to a category", () => {
    const types = ["TRAINING_CHANGE", "NEW_VIDEO", "NEW_EVALUATION", "NEW_FEEDBACK", "ANNOUNCEMENT", "REGISTRATION_UPDATE"] as const;
    for (const t of types) {
      expect(NOTIFICATION_CATEGORIES).toContain(CATEGORY_FOR_TYPE[t]);
    }
  });

  it("labels and defaults every category", () => {
    for (const c of NOTIFICATION_CATEGORIES) {
      expect(CATEGORY_LABEL[c]).toBeTruthy();
      expect(CATEGORY_DEFAULTS[c]).toHaveProperty("push");
      expect(CATEGORY_DEFAULTS[c]).toHaveProperty("email");
    }
  });

  it("email defaults off (no provider on the free tier)", () => {
    for (const c of NOTIFICATION_CATEGORIES) expect(CATEGORY_DEFAULTS[c].email).toBe(false);
  });
});
