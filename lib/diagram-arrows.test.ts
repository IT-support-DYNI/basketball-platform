import { describe, it, expect } from "vitest";

import { angleAt, arrowPath, controlPoint, pointAt } from "./diagram-arrows";
import { advanceAlongArrows } from "./diagram-steps";
import { courtDiagramSchema } from "./contracts/training";
import { ARROW_KINDS, ARROW_LABEL } from "./training";

const A = { x: 0, y: 0 };
const B = { x: 100, y: 0 };

describe("arrow geometry", () => {
  it("draws a straight line when there's no bend", () => {
    expect(arrowPath(A, B)).toBe("M 0 0 L 100 0");
    expect(arrowPath(A, B, 0)).toBe("M 0 0 L 100 0");
  });

  it("bends to opposite sides for positive and negative curve", () => {
    expect(controlPoint(A, B, 1)).toEqual({ x: 50, y: 50 });
    expect(controlPoint(A, B, -1)).toEqual({ x: 50, y: -50 });
    expect(arrowPath(A, B, 1)).toBe("M 0 0 Q 50 50 100 0");
  });

  it("always starts and ends on the arrow's two points", () => {
    for (const c of [-1, -0.5, 0, 0.5, 1]) {
      expect(pointAt(A, B, c, 0)).toEqual(A);
      expect(pointAt(A, B, c, 1)).toEqual(B);
    }
  });

  it("reports the direction of travel, so end bars and ticks sit square to the line", () => {
    expect(angleAt(A, B, 0, 1)).toBeCloseTo(0);
    expect(angleAt(A, { x: 0, y: 100 }, 0, 0.5)).toBeCloseTo(90);
    // A curve bending one way arrives heading back the other way.
    expect(angleAt(A, B, 1, 1)).toBeLessThan(0);
  });
});

describe("new arrow kinds", () => {
  it("labels every kind", () => {
    for (const k of ARROW_KINDS) expect(ARROW_LABEL[k]).toBeTruthy();
    expect(ARROW_KINDS).toEqual(expect.arrayContaining(["cut", "handoff", "shot"]));
  });

  it("stores a bend between -1 and 1, and old arrows without one still validate", () => {
    const arrow = { id: "a", kind: "cut", from: { x: 0.2, y: 0.2 }, to: { x: 0.5, y: 0.5 } };
    expect(courtDiagramSchema.safeParse({ markers: [], arrows: [arrow] }).success).toBe(true);
    expect(courtDiagramSchema.safeParse({ markers: [], arrows: [{ ...arrow, curve: 0.5 }] }).success).toBe(true);
    expect(courtDiagramSchema.safeParse({ markers: [], arrows: [{ ...arrow, curve: 2 }] }).success).toBe(false);
  });

  it("a cut moves the player; a handoff and a shot move only the ball", () => {
    const p = { id: "p", kind: "player" as const, x: 0.5, y: 0.6 };
    const b = { id: "b", kind: "ball" as const, x: 0.52, y: 0.62 };
    const cut = advanceAlongArrows({ markers: [p], arrows: [{ id: "c", kind: "cut", from: { x: 0.5, y: 0.6 }, to: { x: 0.5, y: 0.2 }, curve: 0.5 }] });
    expect(cut[0]).toMatchObject({ x: 0.5, y: 0.2 });
    for (const kind of ["handoff", "shot"] as const) {
      const out = advanceAlongArrows({ markers: [p, b], arrows: [{ id: "x", kind, from: { x: 0.52, y: 0.62 }, to: { x: 0.5, y: 0.1 } }] });
      expect(out.find((m) => m.id === "p")).toMatchObject({ x: 0.5, y: 0.6 });
      expect(out.find((m) => m.id === "b")!.y).toBeCloseTo(0.13);
    }
  });
});
