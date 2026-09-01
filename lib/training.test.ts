import { describe, it, expect } from "vitest";

import {
  DRILL_CATEGORIES,
  DRILL_DIFFICULTIES,
  DRILL_CATEGORY_LABEL,
  DRILL_DIFFICULTY_LABEL,
} from "./training";

describe("training labels", () => {
  it("labels every drill category and difficulty", () => {
    for (const c of DRILL_CATEGORIES) {
      expect(DRILL_CATEGORY_LABEL[c]).toBeTruthy();
      expect(DRILL_CATEGORY_LABEL[c]).not.toMatch(/_/);
    }
    for (const d of DRILL_DIFFICULTIES) {
      expect(DRILL_DIFFICULTY_LABEL[d]).toBeTruthy();
    }
  });
});
