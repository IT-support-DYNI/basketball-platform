"use client";

import { useId, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import {
  ARROW_KINDS,
  ARROW_LABEL,
  MARKER_KINDS,
  MARKER_LABEL,
  describeDiagram,
  EMPTY_DIAGRAM,
  type CourtDiagram,
} from "@/lib/training";

/* viewBox + playable inset (6px margin round a 500×470 half-court, basket top) */
const VB_W = 500;
const VB_H = 470;
const M = 6;
const IN_W = VB_W - 2 * M;
const IN_H = VB_H - 2 * M;
const X = (n: number) => M + n * IN_W;
const Y = (n: number) => M + n * IN_H;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const rid = () => Math.random().toString(36).slice(2, 9);

type Tool = "select" | (typeof MARKER_KINDS)[number] | (typeof ARROW_KINDS)[number];
const isMarkerTool = (t: Tool): t is (typeof MARKER_KINDS)[number] =>
  (MARKER_KINDS as readonly string[]).includes(t);
const isArrowTool = (t: Tool): t is (typeof ARROW_KINDS)[number] =>
  (ARROW_KINDS as readonly string[]).includes(t);

export default function CourtDiagram({
  value,
  onChange,
  className,
}: {
  value: CourtDiagram | null;
  onChange?: (d: CourtDiagram) => void;
  className?: string;
}) {
  const editable = !!onChange;
  const d = value ?? EMPTY_DIAGRAM;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const uid = useId().replace(/[:]/g, "");

  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<string | null>(null);

  function pointFromEvent(e: { clientX: number; clientY: number }) {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) };
  }

  function commit(next: CourtDiagram) {
    onChange?.(next);
  }

  function onSurfaceClick(e: React.MouseEvent) {
    if (!editable) return;
    const p = pointFromEvent(e);
    if (isMarkerTool(tool)) {
      commit({ ...d, markers: [...d.markers, { id: rid(), kind: tool, x: p.x, y: p.y, ...(tool === "player" ? { label: String(d.markers.filter((m) => m.kind === "player").length + 1) } : {}) }] });
    } else if (isArrowTool(tool)) {
      if (!pending) setPending(p);
      else {
        commit({ ...d, arrows: [...d.arrows, { id: rid(), kind: tool, from: pending, to: p }] });
        setPending(null);
      }
    } else {
      setSelected(null);
    }
  }

  function onMarkerPointerDown(e: React.PointerEvent, id: string) {
    if (!editable) return;
    e.stopPropagation();
    setSelected(id);
    if (tool === "select") {
      drag.current = id;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  }
  function onSurfacePointerMove(e: React.PointerEvent) {
    if (!editable || !drag.current) return;
    const p = pointFromEvent(e);
    commit({ ...d, markers: d.markers.map((m) => (m.id === drag.current ? { ...m, x: p.x, y: p.y } : m)) });
  }
  function onSurfacePointerUp() {
    drag.current = null;
  }

  function removeSelected() {
    if (!selected) return;
    commit({
      markers: d.markers.filter((m) => m.id !== selected),
      arrows: d.arrows.filter((a) => a.id !== selected),
    });
    setSelected(null);
  }
  function setLabel(label: string) {
    if (!selected) return;
    commit({ ...d, markers: d.markers.map((m) => (m.id === selected ? { ...m, label: label.slice(0, 3) } : m)) });
  }

  const selectedMarker = d.markers.find((m) => m.id === selected) ?? null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {editable && (
        <div
          className="flex flex-wrap gap-1"
          role="toolbar"
          aria-label="Court diagram tools"
          onKeyDown={(e) => {
            if ((e.key === "Delete" || e.key === "Backspace") && selected) {
              e.preventDefault();
              removeSelected();
            }
          }}
        >
          <ToolButton active={tool === "select"} onClick={() => { setTool("select"); setPending(null); }}>Move / select</ToolButton>
          {MARKER_KINDS.map((k) => (
            <ToolButton key={k} active={tool === k} onClick={() => { setTool(k); setPending(null); }}>{MARKER_LABEL[k]}</ToolButton>
          ))}
          {ARROW_KINDS.map((k) => (
            <ToolButton key={k} active={tool === k} onClick={() => { setTool(k); setPending(null); }}>{ARROW_LABEL[k]} →</ToolButton>
          ))}
          <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
          {selectedMarker?.kind === "player" && (
            <input
              value={selectedMarker.label ?? ""}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={3}
              aria-label="Selected player label"
              className="w-12 rounded-control border border-line bg-surface-2 px-2 py-1 text-center text-xs text-ink"
            />
          )}
          <ToolButton onClick={removeSelected} disabled={!selected}>Delete selected</ToolButton>
          <ToolButton onClick={() => { commit({ markers: [], arrows: [] }); setSelected(null); setPending(null); }} disabled={d.markers.length === 0 && d.arrows.length === 0}>
            Clear
          </ToolButton>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className={cn(
          "w-full max-w-md rounded-card border border-line bg-surface-2",
          editable && tool !== "select" && "cursor-crosshair",
        )}
        role="img"
        aria-label={editable ? `Court diagram editor. ${describeDiagram(d)}` : describeDiagram(d)}
        onClick={onSurfaceClick}
        onPointerMove={onSurfacePointerMove}
        onPointerUp={onSurfacePointerUp}
      >
        <defs>
          <marker id={`${uid}-head`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>

        <CourtMarkings />

        {/* arrows */}
        {d.arrows.map((a) => {
          const dashed = a.kind === "pass" ? "6 5" : a.kind === "dribble" ? "2 4" : undefined;
          return (
            <g key={a.id} className="text-ink-dim" onClick={(e) => { e.stopPropagation(); if (editable) setSelected(a.id); }}>
              <line
                x1={X(a.from.x)} y1={Y(a.from.y)} x2={X(a.to.x)} y2={Y(a.to.y)}
                stroke="currentColor"
                strokeWidth={selected === a.id ? 3.5 : 2}
                strokeDasharray={dashed}
                markerEnd={a.kind === "screen" ? undefined : `url(#${uid}-head)`}
              />
              {a.kind === "screen" && (
                <line
                  x1={X(a.to.x) - 10} y1={Y(a.to.y)} x2={X(a.to.x) + 10} y2={Y(a.to.y)}
                  stroke="currentColor" strokeWidth={3}
                  transform={`rotate(${(Math.atan2(a.to.y - a.from.y, a.to.x - a.from.x) * 180) / Math.PI} ${X(a.to.x)} ${Y(a.to.y)})`}
                />
              )}
            </g>
          );
        })}

        {/* pending arrow start */}
        {pending && <circle cx={X(pending.x)} cy={Y(pending.y)} r={4} className="fill-flame" />}

        {/* markers */}
        {d.markers.map((m) => (
          <Marker key={m.id} m={m} selected={selected === m.id} onPointerDown={(e) => onMarkerPointerDown(e, m.id)} />
        ))}
      </svg>

      {editable && (
        <p className="text-xs text-ink-faint">
          {tool === "select"
            ? "Tap a tool, then tap the court to place it. Drag a marker to move it. Arrows need two taps."
            : isArrowTool(tool)
              ? pending
                ? "Now tap where the arrow ends."
                : "Tap where the arrow starts."
              : `Tap the court to drop a ${MARKER_LABEL[tool as keyof typeof MARKER_LABEL].toLowerCase()}.`}
        </p>
      )}
    </div>
  );
}

function ToolButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-40",
        active ? "border-flame/40 bg-flame/10 text-flame-ink" : "border-line text-ink-dim hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Marker({
  m,
  selected,
  onPointerDown,
}: {
  m: CourtDiagram["markers"][number];
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const cx = X(m.x);
  const cy = Y(m.y);
  const ring = selected ? <circle cx={cx} cy={cy} r={20} className="fill-none stroke-flame" strokeWidth={2} /> : null;

  if (m.kind === "opponent") {
    return (
      <g onPointerDown={onPointerDown} className="cursor-grab text-info">
        {ring}
        <line x1={cx - 10} y1={cy - 10} x2={cx + 10} y2={cy + 10} stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" />
        <line x1={cx - 10} y1={cy + 10} x2={cx + 10} y2={cy - 10} stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" />
      </g>
    );
  }
  if (m.kind === "cone") {
    return (
      <g onPointerDown={onPointerDown} className="cursor-grab">
        {ring}
        <path d={`M ${cx} ${cy - 12} L ${cx + 10} ${cy + 9} L ${cx - 10} ${cy + 9} Z`} className="fill-ember" />
      </g>
    );
  }
  if (m.kind === "ball") {
    return (
      <g onPointerDown={onPointerDown} className="cursor-grab">
        {ring}
        <circle cx={cx} cy={cy} r={8} className="fill-ember stroke-ink" strokeWidth={1} />
        <path d={`M ${cx - 8} ${cy} h16 M ${cx} ${cy - 8} v16`} className="stroke-ink" strokeWidth={1} fill="none" />
      </g>
    );
  }
  if (m.kind === "coach") {
    return (
      <g onPointerDown={onPointerDown} className="cursor-grab">
        {ring}
        <rect x={cx - 11} y={cy - 11} width={22} height={22} rx={3} className="fill-ink-dim" />
        <text x={cx} y={cy + 4} textAnchor="middle" className="fill-surface text-[11px] font-bold">C</text>
      </g>
    );
  }
  // player
  return (
    <g onPointerDown={onPointerDown} className="cursor-grab">
      {ring}
      <circle cx={cx} cy={cy} r={15} className="fill-flame" />
      <text x={cx} y={cy + 5} textAnchor="middle" className="fill-on-flame text-[13px] font-bold">
        {m.label ?? ""}
      </text>
    </g>
  );
}

/** The half-court markings. Purely decorative; not interactive. */
function CourtMarkings() {
  return (
    <g className="stroke-line-strong" fill="none" strokeWidth={2} pointerEvents="none" aria-hidden>
      <rect x={M} y={M} width={IN_W} height={IN_H} rx={4} />
      {/* key / paint */}
      <rect x={X(0.34)} y={M} width={X(0.66) - X(0.34)} height={Y(0.4) - M} />
      {/* free-throw circle: top solid, bottom dashed */}
      <path d={`M ${X(0.34)} ${Y(0.4)} A 60 60 0 0 1 ${X(0.66)} ${Y(0.4)}`} />
      <path d={`M ${X(0.34)} ${Y(0.4)} A 60 60 0 0 0 ${X(0.66)} ${Y(0.4)}`} strokeDasharray="5 5" />
      {/* backboard + hoop */}
      <line x1={X(0.4)} y1={Y(0.08)} x2={X(0.6)} y2={Y(0.08)} strokeWidth={3} />
      <circle cx={X(0.5)} cy={Y(0.1)} r={9} />
      {/* three-point line (approximation) */}
      <path d={`M ${X(0.07)} ${M} L ${X(0.07)} ${Y(0.24)} Q ${X(0.5)} ${Y(0.56)} ${X(0.93)} ${Y(0.24)} L ${X(0.93)} ${M}`} />
      {/* half-court centre circle (bottom edge) */}
      <path d={`M ${X(0.4)} ${VB_H - M} A 40 40 0 0 1 ${X(0.6)} ${VB_H - M}`} />
    </g>
  );
}
