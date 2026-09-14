/**
 * A thin bar whose real width IS the percentage — the "animation" is only a
 * left-anchored scaleX reveal on top of that already-correct width, so there
 * is no JS interpolating a fake number toward a target. Pure CSS; works fine
 * as a server component. Off under prefers-reduced-motion (see globals.css).
 */
export default function ProgressBar({ pct, colorClass = "bg-success" }: { pct: number; colorClass?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className={`animate-grow-x h-full rounded-full ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
