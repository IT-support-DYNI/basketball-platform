import type { DiagramFrame } from "./contracts/training";

/**
 * Starting positions for common sets, so a coach drops the five players on the
 * court in one go instead of placing each one. Coordinates use the diagram's
 * half court (0 to 1, basket at the top): hoop ~(0.5, 0.10), elbows
 * (0.34 / 0.66, 0.40), blocks (0.30 / 0.70, 0.20), wings (0.13 / 0.87, 0.42),
 * corners (0.05 / 0.95, 0.13), top of the key (0.5, 0.62).
 */

type Spot = [label: string, x: number, y: number];

export type DiagramTemplate = {
  id: string;
  name: string;
  group: "Offence" | "Defence";
  /** Offence: players 1 to 5, ball with 1. Defence: five defenders. */
  spots: Spot[];
};

const TOP: Spot = ["1", 0.5, 0.62];
const WING_L: [number, number] = [0.13, 0.42];
const WING_R: [number, number] = [0.87, 0.42];
const CORNER_L: [number, number] = [0.05, 0.13];
const CORNER_R: [number, number] = [0.95, 0.13];
const ELBOW_L: [number, number] = [0.34, 0.4];
const ELBOW_R: [number, number] = [0.66, 0.4];
const BLOCK_L: [number, number] = [0.3, 0.2];
const BLOCK_R: [number, number] = [0.7, 0.2];

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  { id: "5-out", name: "5 Out", group: "Offence", spots: [TOP, ["2", ...WING_R], ["3", ...WING_L], ["4", ...CORNER_R], ["5", ...CORNER_L]] },
  { id: "4-out-1-in", name: "4 Out 1 In", group: "Offence", spots: [TOP, ["2", ...WING_R], ["3", ...WING_L], ["4", ...CORNER_R], ["5", ...BLOCK_L]] },
  { id: "horns", name: "Horns", group: "Offence", spots: [TOP, ["2", ...CORNER_L], ["3", ...CORNER_R], ["4", ...ELBOW_L], ["5", ...ELBOW_R]] },
  { id: "1-4-high", name: "1-4 High", group: "Offence", spots: [["1", 0.5, 0.68], ["2", ...WING_L], ["3", ...WING_R], ["4", ...ELBOW_L], ["5", ...ELBOW_R]] },
  { id: "1-4-low", name: "1-4 Low", group: "Offence", spots: [TOP, ["2", ...CORNER_L], ["3", ...CORNER_R], ["4", ...BLOCK_L], ["5", ...BLOCK_R]] },
  { id: "box", name: "Box", group: "Offence", spots: [TOP, ["2", ...BLOCK_L], ["3", ...BLOCK_R], ["4", ...ELBOW_L], ["5", ...ELBOW_R]] },
  { id: "2-3-zone", name: "2-3 Zone", group: "Defence", spots: [["", 0.38, 0.5], ["", 0.62, 0.5], ["", 0.2, 0.24], ["", 0.5, 0.2], ["", 0.8, 0.24]] },
  { id: "3-2-zone", name: "3-2 Zone", group: "Defence", spots: [["", 0.5, 0.56], ["", 0.2, 0.4], ["", 0.8, 0.4], ["", 0.35, 0.22], ["", 0.65, 0.22]] },
  { id: "1-3-1-zone", name: "1-3-1 Zone", group: "Defence", spots: [["", 0.5, 0.62], ["", 0.15, 0.4], ["", 0.5, 0.4], ["", 0.85, 0.4], ["", 0.5, 0.15]] },
];

/** Where a ball sits relative to the player holding it (matches lib/diagram-steps). */
const BALL_OFFSET = 0.03;

/**
 * The markers for a template, with fresh ids from `newId` so they never clash
 * with ids already in the diagram (ids are what step animation follows).
 * Offence sets include the ball with player 1.
 */
export function templateMarkers(t: DiagramTemplate, newId: () => string, yScale = 1): DiagramFrame["markers"] {
  const markers: DiagramFrame["markers"] = t.spots.map(([label, x, yHalf]) => ({ label, x, y: yHalf * yScale })).map(({ label, x, y }) =>
    t.group === "Offence"
      ? { id: newId(), kind: "player" as const, x, y, label }
      : { id: newId(), kind: "opponent" as const, x, y },
  );
  if (t.group === "Offence") {
    const one = markers.find((m) => m.label === "1");
    if (one) markers.push({ id: newId(), kind: "ball", x: Math.min(1, one.x + BALL_OFFSET), y: Math.min(1, one.y + BALL_OFFSET * yScale) });
  }
  return markers;
}

export function templateById(id: string): DiagramTemplate | undefined {
  return DIAGRAM_TEMPLATES.find((t) => t.id === id);
}

/**
 * Put a template on one step. An offence set replaces the players and ball
 * already there; a defence set replaces the defenders. Everything else (the
 * other side, cones, coach, arrows) stays, so "Horns" then "2-3 Zone" gives
 * an offence against a zone.
 */
export function applyTemplate(frame: DiagramFrame, t: DiagramTemplate, newId: () => string, yScale = 1): DiagramFrame {
  const replaces = t.group === "Offence" ? ["player", "ball"] : ["opponent"];
  return {
    ...frame,
    markers: [...frame.markers.filter((m) => !replaces.includes(m.kind)), ...templateMarkers(t, newId, yScale)],
  };
}

/** Would applying this template remove markers the coach already placed? */
export function templateReplacesSomething(frame: DiagramFrame, t: DiagramTemplate): boolean {
  const replaces = t.group === "Offence" ? ["player", "ball"] : ["opponent"];
  return frame.markers.some((m) => replaces.includes(m.kind));
}
