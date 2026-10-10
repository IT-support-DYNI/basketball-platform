import type { CourtDiagram, DiagramFrame } from "./contracts/training";

/**
 * Half or full court. A full court is vertical: the usual half court (basket at
 * the top) is the top half, mirrored below. Coordinates are 0 to 1 over the
 * whole court either way, so a half-court point (x, y) is (x, y / 2) on a full
 * court. A diagram with no `court` is a half court (every older diagram).
 */

export type CourtType = "half" | "full";

export const courtOf = (d: CourtDiagram | null | undefined): CourtType => (d?.court === "full" ? "full" : "half");

type Pt = { x: number; y: number };
const mapFrame = (f: DiagramFrame, map: (p: Pt) => Pt): DiagramFrame => ({
  ...f,
  markers: f.markers.map((m) => ({ ...m, ...map(m) })),
  arrows: f.arrows.map((a) => ({ ...a, from: map(a.from), to: map(a.to) })),
});

/** Half to full: everything moves into the top half. Nothing is lost. */
export function toFullCourt(d: CourtDiagram): CourtDiagram {
  if (courtOf(d) === "full") return d;
  const half = ({ x, y }: Pt) => ({ x, y: y / 2 });
  const first = mapFrame(d, half);
  return {
    ...first,
    ...(d.steps ? { steps: d.steps.map((s) => mapFrame(s, half)) } : {}),
    court: "full",
  };
}

/**
 * Full to half: the top half is kept and stretched back to a half court;
 * markers in the far half, and arrows with either end there, are dropped.
 * `dropped` counts them so the editor can ask first.
 */
export function toHalfCourt(d: CourtDiagram): { diagram: CourtDiagram; dropped: number } {
  if (courtOf(d) === "half") return { diagram: d, dropped: 0 };
  let dropped = 0;
  const inTop = (p: Pt) => p.y <= 0.5;
  const shrink = (f: DiagramFrame): DiagramFrame => {
    const markers = f.markers.filter(inTop);
    const arrows = f.arrows.filter((a) => inTop(a.from) && inTop(a.to));
    dropped += f.markers.length - markers.length + f.arrows.length - arrows.length;
    return mapFrame({ ...f, markers, arrows }, ({ x, y }) => ({ x, y: Math.min(1, y * 2) }));
  };
  const { court: _court, steps, ...first } = d;
  const top = shrink(first);
  return {
    diagram: { ...top, ...(steps ? { steps: steps.map(shrink) } : {}) },
    dropped,
  };
}

/** Templates are drawn for a half court; on a full court they go in the top half. */
export const templateYScale = (court: CourtType) => (court === "full" ? 0.5 : 1);
