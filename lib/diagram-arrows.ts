/**
 * Geometry for court-diagram arrows. Pure maths in whatever units the caller
 * uses (the diagram draws in its SVG viewBox units). A straight arrow is a
 * line; a curved one is a quadratic Bézier whose control point sits on the
 * perpendicular through the midpoint, pushed out by `curve` times half the
 * arrow's length (so curve 1 is a strong bend, -1 the same bend the other way).
 */

export type Pt = { x: number; y: number };

export function controlPoint(from: Pt, to: Pt, curve = 0): Pt {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Unit perpendicular (rotate the direction 90 degrees), scaled by half the length.
  const len = Math.hypot(dx, dy) || 1;
  const k = (curve * len) / 2;
  return { x: mx + (-dy / len) * k, y: my + (dx / len) * k };
}

/** SVG path data for the arrow's line. */
export function arrowPath(from: Pt, to: Pt, curve = 0): string {
  if (!curve) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  const c = controlPoint(from, to, curve);
  return `M ${from.x} ${from.y} Q ${c.x} ${c.y} ${to.x} ${to.y}`;
}

/** A point part-way along the arrow (t from 0 to 1). */
export function pointAt(from: Pt, to: Pt, curve: number, t: number): Pt {
  const c = controlPoint(from, to, curve);
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * c.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * c.y + t * t * to.y,
  };
}

/** Direction of travel at that point, in degrees (for end bars and handoff ticks). */
export function angleAt(from: Pt, to: Pt, curve: number, t: number): number {
  const c = controlPoint(from, to, curve);
  const dx = 2 * (1 - t) * (c.x - from.x) + 2 * t * (to.x - c.x);
  const dy = 2 * (1 - t) * (c.y - from.y) + 2 * t * (to.y - c.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}
