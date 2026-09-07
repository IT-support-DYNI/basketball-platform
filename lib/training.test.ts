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
  diagramHasContent,
  describeDiagram,
  EMPTY_DIAGRAM,
} from "./training";
import { courtDiagramSchema } from "./contracts/training";

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

describe("court diagram", () => {
  const sample = {
    markers: [
      { id: "a", kind: "player" as const, x: 0.5, y: 0.3, label: "1" },
      { id: "b", kind: "cone" as const, x: 0.2, y: 0.8 },
    ],
    arrows: [{ id: "c", kind: "pass" as const, from: { x: 0.5, y: 0.3 }, to: { x: 0.8, y: 0.6 } }],
  };

  it("validates a well-formed diagram and rejects out-of-range coordinates", () => {
    expect(courtDiagramSchema.safeParse(sample).success).toBe(true);
    expect(courtDiagramSchema.safeParse(EMPTY_DIAGRAM).success).toBe(true);
    expect(courtDiagramSchema.safeParse({ ...sample, markers: [{ id: "x", kind: "player", x: 1.4, y: 0 }] }).success).toBe(false);
    expect(courtDiagramSchema.safeParse({ markers: [], arrows: [{ id: "x", kind: "teleport", from: { x: 0, y: 0 }, to: { x: 1, y: 1 } }] }).success).toBe(false);
  });

  it("diagramHasContent / describeDiagram", () => {
    expect(diagramHasContent(null)).toBe(false);
    expect(diagramHasContent(EMPTY_DIAGRAM)).toBe(false);
    expect(diagramHasContent(sample)).toBe(true);
    expect(describeDiagram(null)).toBe("No court diagram.");
    expect(describeDiagram(sample)).toContain("1 player");
    expect(describeDiagram(sample)).toContain("1 movement arrow");
  });
});
