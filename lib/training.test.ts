import { describe, it, expect } from "vitest";

import {
  DRILL_CATEGORIES,
  DRILL_DIFFICULTIES,
  DRILL_CATEGORY_LABEL,
  DRILL_DIFFICULTY_LABEL,
  TRAINING_BLOCK_CATEGORIES,
  TRAINING_PLAN_STATUSES,
  TRAINING_BLOCK_CATEGORY_LABEL,
  TRAINING_PLAN_STATUS_LABEL,
  planDurationMinutes,
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

  it("labels every training-block category and plan status", () => {
    for (const c of TRAINING_BLOCK_CATEGORIES) expect(TRAINING_BLOCK_CATEGORY_LABEL[c]).toBeTruthy();
    for (const s of TRAINING_PLAN_STATUSES) expect(TRAINING_PLAN_STATUS_LABEL[s]).toBeTruthy();
  });
});

describe("planDurationMinutes", () => {
  it("sums block durations, treating null/undefined as 0", () => {
    expect(planDurationMinutes([{ durationMinutes: 10 }, { durationMinutes: 15 }, { durationMinutes: null }])).toBe(25);
    expect(planDurationMinutes([])).toBe(0);
  });
});
