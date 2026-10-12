import { describe, it, expect } from "vitest";

import { courtDiagramSchema } from "./contracts/training";
import { DIAGRAM_TEMPLATES, applyTemplate, templateById, templateMarkers, templateReplacesSomething } from "./diagram-templates";

let n = 0;
const newId = () => `t${++n}`;

describe("diagram templates", () => {
  it.each(DIAGRAM_TEMPLATES.map((t) => [t.name, t]))("%s is a valid five-person set on the court", (_name, t) => {
    const markers = templateMarkers(t, newId);
    expect(courtDiagramSchema.safeParse({ markers, arrows: [] }).success).toBe(true);
    const people = markers.filter((m) => m.kind !== "ball");
    expect(people).toHaveLength(5);
    // no two people stacked on the same spot
    const spots = new Set(people.map((m) => `${m.x},${m.y}`));
    expect(spots.size).toBe(5);
    if (t.group === "Offence") {
      expect(people.map((m) => m.label).sort()).toEqual(["1", "2", "3", "4", "5"]);
      expect(markers.filter((m) => m.kind === "ball")).toHaveLength(1);
    } else {
      expect(people.every((m) => m.kind === "opponent")).toBe(true);
    }
  });

  it("gives every marker a fresh id each time", () => {
    const t = templateById("horns")!;
    const a = templateMarkers(t, newId).map((m) => m.id);
    const b = templateMarkers(t, newId).map((m) => m.id);
    expect(new Set([...a, ...b]).size).toBe(a.length + b.length);
  });

  it("an offence set plus a zone puts both on the court", () => {
    const horns = applyTemplate({ markers: [], arrows: [] }, templateById("horns")!, newId);
    const both = applyTemplate(horns, templateById("2-3-zone")!, newId);
    expect(both.markers.filter((m) => m.kind === "player")).toHaveLength(5);
    expect(both.markers.filter((m) => m.kind === "opponent")).toHaveLength(5);
  });

  it("a second offence set replaces the players but keeps defenders, cones and arrows", () => {
    const cone = { id: "c", kind: "cone" as const, x: 0.5, y: 0.9 };
    const arrow = { id: "a", kind: "move" as const, from: { x: 0.1, y: 0.1 }, to: { x: 0.2, y: 0.2 } };
    let f = applyTemplate({ markers: [cone], arrows: [arrow] }, templateById("5-out")!, newId);
    f = applyTemplate(f, templateById("2-3-zone")!, newId);
    expect(templateReplacesSomething(f, templateById("horns")!)).toBe(true);
    f = applyTemplate(f, templateById("horns")!, newId);
    expect(f.markers.filter((m) => m.kind === "player")).toHaveLength(5);
    expect(f.markers.filter((m) => m.kind === "ball")).toHaveLength(1);
    expect(f.markers.filter((m) => m.kind === "opponent")).toHaveLength(5);
    expect(f.markers).toContainEqual(cone);
    expect(f.arrows).toEqual([arrow]);
  });

  it("asks before replacing only when there is something to replace", () => {
    expect(templateReplacesSomething({ markers: [], arrows: [] }, templateById("horns")!)).toBe(false);
  });
});
