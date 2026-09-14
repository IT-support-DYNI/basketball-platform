/**
 * A minimal self-drawing trend line — "charts draw themselves" per the design
 * brief, without pulling in a charting library for four points. `pathLength`
 * normalises the SVG's own dash math to 0–100 regardless of the polyline's
 * actual geometry, so the draw-in animation in globals.css doesn't need to
 * know the real path length.
 */
export default function Sparkline({ values, max = 10 }: { values: number[]; max?: number }) {
  if (values.length < 2) return null;
  const w = 100;
  const h = 28;
  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => `${i * stepX},${h - (Math.max(0, Math.min(max, v)) / max) * h}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-1.5 h-7 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="rgb(var(--info))"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        className="animate-draw-line"
      />
    </svg>
  );
}
