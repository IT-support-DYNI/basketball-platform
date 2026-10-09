import { describe, it, expect } from "vitest";

import { courtDiagramSchema } from "./contracts/training";
import { describeDiagram, diagramHasContent } from "./training";
import {
  MAX_DIAGRAM_STEPS,
  addStepAfter,
  advanceAlongArrows,
  diagramFrames,
  easeInOut,
  fromFrames,
  interpolateMarkers,
  removeStep,
  type DiagramFrame,
} from "./diagram-steps";

const p1 = { id: "p1", kind: "player" as const, x: 0.5, y: 0.6, label: "1" };
const p4 = { id: "p4", kind: "player" as const, x: 0.3, y: 0.4, label: "4" };
const ball = { id: "b", kind: "ball" as const, x: 0.52, y: 0.62 };
const x1 = { id: "x1", kind: "opponent" as const, x: 0.5, y: 0.45 };

describe("storage stays backward compatible", () => {
  it("a diagram saved before steps existed is a one-step diagram", () => {
    const old = { markers: [p1], arrows: [] };
    expect(courtDiagramSchema.safeParse(old).success).toBe(true);
    expect(diagramFrames(old)).toEqual([{ markers: [p1], arrows: [] }]);
    expect(fromFrames(diagramFrames(old))).toEqual(old);
  });

  it("round-trips several steps, step 1 at the top level", () => {
    const frames: DiagramFrame[] = [
      { markers: [p1], arrows: [], caption: "Set up" },
      { markers: [{ ...p1, y: 0.3 }], arrows: [], caption: "Drive" },
    ];
    const stored = fromFrames(frames);
    expect(stored.markers).toEqual([p1]);
    expect(stored.caption).toBe("Set up");
    expect(stored.steps).toHaveLength(1);
    expect(courtDiagramSchema.safeParse(stored).success).toBe(true);
    expect(diagramFrames(stored)).toEqual(frames);
  });

  it("caps the number of steps", () => {
    const many = { markers: [], arrows: [], steps: Array.from({ length: MAX_DIAGRAM_STEPS }, () => ({ markers: [], arrows: [] })) };
    expect(courtDiagramSchema.safeParse(many).success).toBe(false);
  });

  it("counts content in any step and mentions the step count", () => {
    const later = { markers: [], arrows: [], steps: [{ markers: [p1], arrows: [] }] };
    expect(diagramHasContent(later)).toBe(true);
    expect(describeDiagram({ markers: [p1], arrows: [], steps: [{ markers: [p1], arrows: [] }] })).toMatch(/1 player.*2 steps/);
  });
});

describe("advanceAlongArrows", () => {
  it("moves a player to the end of a movement arrow that starts on them", () => {
    const f: DiagramFrame = {
      markers: [p1, p4],
      arrows: [{ id: "a", kind: "move", from: { x: 0.31, y: 0.41 }, to: { x: 0.6, y: 0.2 } }],
    };
    const out = advanceAlongArrows(f);
    expect(out.find((m) => m.id === "p4")).toMatchObject({ x: 0.6, y: 0.2 });
    expect(out.find((m) => m.id === "p1")).toMatchObject({ x: 0.5, y: 0.6 });
  });

  it("a pass moves the ball, not the passer", () => {
    const f: DiagramFrame = {
      markers: [p1, ball, p4],
      arrows: [{ id: "a", kind: "pass", from: { x: 0.51, y: 0.61 }, to: { x: 0.3, y: 0.4 } }],
    };
    const out = advanceAlongArrows(f);
    expect(out.find((m) => m.id === "b")!.x).toBeCloseTo(0.33);
    expect(out.find((m) => m.id === "b")!.y).toBeCloseTo(0.43);
    expect(out.find((m) => m.id === "p1")).toMatchObject({ x: 0.5, y: 0.6 });
  });

  it("a dribble takes the player and the ball together", () => {
    const f: DiagramFrame = {
      markers: [p1, ball],
      arrows: [{ id: "a", kind: "dribble", from: { x: 0.5, y: 0.6 }, to: { x: 0.8, y: 0.5 } }],
    };
    const out = advanceAlongArrows(f);
    expect(out.find((m) => m.id === "p1")).toMatchObject({ x: 0.8, y: 0.5 });
    expect(out.find((m) => m.id === "b")!.x).toBeCloseTo(0.83);
  });

  it("ignores arrows that don't start near anyone, and moves each marker once", () => {
    const f: DiagramFrame = {
      markers: [p1, x1],
      arrows: [
        { id: "a", kind: "move", from: { x: 0.9, y: 0.9 }, to: { x: 0.1, y: 0.1 } },
        { id: "b", kind: "move", from: { x: 0.5, y: 0.6 }, to: { x: 0.2, y: 0.2 } },
        { id: "c", kind: "move", from: { x: 0.5, y: 0.6 }, to: { x: 0.9, y: 0.2 } },
      ],
    };
    const out = advanceAlongArrows(f);
    expect(out.find((m) => m.id === "p1")).toMatchObject({ x: 0.2, y: 0.2 });
  });
});

describe("adding, removing and animating steps", () => {
  const start: DiagramFrame = {
    markers: [p1, p4],
    arrows: [{ id: "a", kind: "move", from: { x: 0.3, y: 0.4 }, to: { x: 0.6, y: 0.2 } }],
    caption: "Set",
  };

  it("adds a step with the same ids, moved along the arrows, and no arrows yet", () => {
    const frames = addStepAfter([start], 0);
    expect(frames).toHaveLength(2);
    expect(frames[1].arrows).toEqual([]);
    expect(frames[1].markers.map((m) => m.id)).toEqual(["p1", "p4"]);
    expect(frames[1].markers[1]).toMatchObject({ x: 0.6, y: 0.2 });
  });

  it("won't go past the step limit or remove the last step", () => {
    const full = Array.from({ length: MAX_DIAGRAM_STEPS }, () => start);
    expect(addStepAfter(full, 0)).toBe(full);
    expect(removeStep([start], 0)).toEqual([start]);
    expect(removeStep(addStepAfter([start], 0), 1)).toEqual([start]);
  });

  it("slides markers that exist in both steps; new ones appear in place", () => {
    const b: DiagramFrame = { markers: [{ ...p1, x: 0.9 }, x1], arrows: [] };
    const half = interpolateMarkers({ markers: [p1], arrows: [] }, b, 0.5);
    expect(half.find((m) => m.id === "p1")!.x).toBeCloseTo(0.7);
    expect(half.find((m) => m.id === "x1")).toEqual(x1);
  });

  it("eases from 0 to 1", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });
});
