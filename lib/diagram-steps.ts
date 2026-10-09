import { MAX_DIAGRAM_STEPS, type CourtDiagram, type DiagramFrame } from "./contracts/training";

/**
 * Multi-step court diagrams (plays). Pure helpers, no React or DB, shared by
 * the editor, the read-only player and the tests.
 *
 * Storage keeps step 1 at the top level (`markers`, `arrows`, `caption`) and
 * steps 2+ in `steps`, so a diagram saved before steps existed is a valid
 * one-step diagram. Work with the flat list from `diagramFrames` and turn it
 * back with `fromFrames`.
 */

export { MAX_DIAGRAM_STEPS };
export type { DiagramFrame };
type Marker = DiagramFrame["markers"][number];
type Arrow = DiagramFrame["arrows"][number];

export function diagramFrames(d: CourtDiagram | null | undefined): DiagramFrame[] {
  if (!d) return [{ markers: [], arrows: [] }];
  const first: DiagramFrame = { markers: d.markers, arrows: d.arrows, ...(d.caption ? { caption: d.caption } : {}) };
  return [first, ...(d.steps ?? [])];
}

export function fromFrames(frames: DiagramFrame[]): CourtDiagram {
  const [first, ...rest] = frames.length ? frames : [{ markers: [], arrows: [] }];
  return {
    markers: first.markers,
    arrows: first.arrows,
    ...(first.caption ? { caption: first.caption } : {}),
    ...(rest.length ? { steps: rest } : {}),
  };
}

/** Where a ball sits relative to the player holding it. */
const BALL_OFFSET = 0.03;
/** How close (in court widths) an arrow's start must be to a marker to "belong" to it. */
const REACH = 0.07;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

function nearest(markers: Marker[], at: { x: number; y: number }, kinds: Marker["kind"][], taken: Set<string>) {
  let best: Marker | null = null;
  for (const m of markers) {
    if (!kinds.includes(m.kind) || taken.has(m.id)) continue;
    const d = dist(m, at);
    if (d <= REACH && (!best || d < dist(best, at))) best = m;
  }
  return best;
}

/**
 * Where everyone ends up after a step's arrows play out: a player with a move,
 * cut or screen arrow starting on them goes to its end; a dribble takes the
 * player and the ball; a pass, handoff or shot takes only the ball. A curved
 * arrow ends in the same place as a straight one. Markers no arrow touches stay put. Each
 * marker moves at most once, so two arrows can't fight over one player.
 */
export function advanceAlongArrows(frame: DiagramFrame): Marker[] {
  const moved = new Map<string, { x: number; y: number }>();
  const taken = new Set<string>();
  const people: Marker["kind"][] = ["player", "opponent", "coach"];
  const claim = (m: Marker | null, to: Arrow["to"]) => {
    if (!m) return;
    taken.add(m.id);
    // A ball sits just off the player's hand rather than dead centre on them.
    const nudge = m.kind === "ball" ? BALL_OFFSET : 0;
    moved.set(m.id, { x: Math.min(1, to.x + nudge), y: Math.min(1, to.y + nudge) });
  };

  for (const a of frame.arrows) {
    // Pass, handoff and shot move the ball; the player stays where they are.
    if (a.kind === "pass" || a.kind === "handoff" || a.kind === "shot") claim(nearest(frame.markers, a.from, ["ball"], taken), a.to);
    else if (a.kind === "dribble") {
      claim(nearest(frame.markers, a.from, people, taken), a.to);
      claim(nearest(frame.markers, a.from, ["ball"], taken), a.to);
    } else claim(nearest(frame.markers, a.from, people, taken), a.to);
  }
  return frame.markers.map((m) => (moved.has(m.id) ? { ...m, ...moved.get(m.id)! } : m));
}

/** Insert a new step after `index`: the same people (same ids, so they
 *  animate), already moved along that step's arrows, with no arrows yet. */
export function addStepAfter(frames: DiagramFrame[], index: number): DiagramFrame[] {
  if (frames.length >= MAX_DIAGRAM_STEPS) return frames;
  const next: DiagramFrame = { markers: advanceAlongArrows(frames[index]), arrows: [] };
  return [...frames.slice(0, index + 1), next, ...frames.slice(index + 1)];
}

export function removeStep(frames: DiagramFrame[], index: number): DiagramFrame[] {
  if (frames.length <= 1) return frames;
  return frames.filter((_, i) => i !== index);
}

export function replaceStep(frames: DiagramFrame[], index: number, frame: DiagramFrame): DiagramFrame[] {
  return frames.map((f, i) => (i === index ? frame : f));
}

/** Smooth start and stop for the animation. */
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Markers part-way from step `a` to step `b` (t from 0 to 1). A marker in both
 * slides between its two positions; one that only exists in `b` appears in
 * place; one only in `a` is dropped.
 */
export function interpolateMarkers(a: DiagramFrame, b: DiagramFrame, t: number): Marker[] {
  const from = new Map(a.markers.map((m) => [m.id, m]));
  const k = Math.min(1, Math.max(0, t));
  return b.markers.map((m) => {
    const s = from.get(m.id);
    if (!s) return m;
    return { ...m, x: s.x + (m.x - s.x) * k, y: s.y + (m.y - s.y) * k };
  });
}
