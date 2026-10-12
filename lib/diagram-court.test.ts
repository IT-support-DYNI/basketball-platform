import { describe, it, expect } from "vitest";

import { courtDiagramSchema, type CourtDiagram } from "./contracts/training";
import { courtOf, templateYScale, toFullCourt, toHalfCourt } from "./diagram-court";
import { applyTemplate, templateById } from "./diagram-templates";

const p = (id: string, x: number, y: number) => ({ id, kind: "player" as const, x, y, label: id });

describe("half and full court", () => {
  it("a diagram without a court is a half court (every older diagram)", () => {
    expect(courtOf({ markers: [], arrows: [] })).toBe("half");
    expect(courtOf(null)).toBe("half");
    expect(courtDiagramSchema.safeParse({ markers: [], arrows: [], court: "full" }).success).toBe(true);
    expect(courtDiagramSchema.safeParse({ markers: [], arrows: [], court: "wide" }).success).toBe(false);
  });

  it("half to full moves everything into the top half, every step, losing nothing", () => {
    const d: CourtDiagram = {
      markers: [p("1", 0.5, 0.6)],
      arrows: [{ id: "a", kind: "move", from: { x: 0.5, y: 0.6 }, to: { x: 0.5, y: 0.2 }, curve: 0.5 }],
      steps: [{ markers: [p("1", 0.5, 0.2)], arrows: [] }],
    };
    const full = toFullCourt(d);
    expect(full.court).toBe("full");
    expect(full.markers[0]).toMatchObject({ x: 0.5, y: 0.3 });
    expect(full.arrows[0]).toMatchObject({ from: { y: 0.3 }, to: { y: 0.1 }, curve: 0.5 });
    expect(full.steps![0].markers[0].y).toBeCloseTo(0.1);
    expect(courtDiagramSchema.safeParse(full).success).toBe(true);
  });

  it("full back to half is a round trip when nothing is in the far half", () => {
    const d: CourtDiagram = { markers: [p("1", 0.5, 0.6), p("2", 0.1, 0.4)], arrows: [] };
    const { diagram, dropped } = toHalfCourt(toFullCourt(d));
    expect(dropped).toBe(0);
    expect(diagram).toEqual(d);
  });

  it("full to half drops what's in the far half and says how much", () => {
    const d: CourtDiagram = {
      court: "full",
      markers: [p("1", 0.5, 0.3), p("2", 0.5, 0.8)],
      arrows: [
        { id: "a", kind: "pass", from: { x: 0.5, y: 0.3 }, to: { x: 0.2, y: 0.4 } },
        { id: "b", kind: "move", from: { x: 0.5, y: 0.8 }, to: { x: 0.5, y: 0.3 } },
      ],
    };
    const { diagram, dropped } = toHalfCourt(d);
    expect(dropped).toBe(2);
    expect(diagram.court).toBeUndefined();
    expect(diagram.markers).toEqual([p("1", 0.5, 0.6)]);
    expect(diagram.arrows).toHaveLength(1);
  });

  it("a template on a full court lands in the top half", () => {
    const f = applyTemplate({ markers: [], arrows: [] }, templateById("5-out")!, () => Math.random().toString(36), templateYScale("full"));
    expect(Math.max(...f.markers.map((m) => m.y))).toBeLessThanOrEqual(0.5);
  });
});
