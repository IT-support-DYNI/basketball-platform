import { statusColor } from "@/lib/design/tokens";

/**
 * Colour + text status pill. Colour is never the only signal — the label is
 * always present. Hues come from the dedicated status scale in
 * lib/design/tokens.ts, distinct from the semantic (error/success) set.
 */
export default function StatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase() as keyof typeof statusColor;
  const color = statusColor[key] ?? "var(--ink-dim)";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {status.replace(/_/g, " ")}
    </span>
  );
}
