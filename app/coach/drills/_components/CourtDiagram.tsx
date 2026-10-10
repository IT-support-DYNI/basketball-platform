"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

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
import {
  MAX_DIAGRAM_STEPS,
  addStepAfter,
  diagramFrames,
  easeInOut,
  fromFrames,
  interpolateMarkers,
  removeStep,
  replaceStep,
  type DiagramFrame,
} from "@/lib/diagram-steps";
import { angleAt, arrowPath, pointAt } from "@/lib/diagram-arrows";
import { DIAGRAM_TEMPLATES, applyTemplate, templateById, templateReplacesSomething } from "@/lib/diagram-templates";
import { courtOf, templateYScale, toFullCourt, toHalfCourt, type CourtType } from "@/lib/diagram-court";

/* viewBox + playable inset (6px margin round a 500×470 half-court, basket top) */
const VB_W = 500;
const VB_H = 470;
const M = 6;
const IN_W = VB_W - 2 * M;
const IN_H = VB_H - 2 * M;
const X = (n: number) => M + n * IN_W;
/** Half-court y; the court markings are always drawn in these units. */
const Y = (n: number) => M + n * IN_H;
/** A full court is two half courts, the second mirrored about the half-way line. */
const FULL_H = 2 * (VB_H - M);
const Y_FULL = (n: number) => M + n * (FULL_H - 2 * M);
type YFn = (n: number) => number;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const rid = () => Math.random().toString(36).slice(2, 9);

/** How long the markers take to slide to the next step, and the pause on each step while playing. */
const STEP_MS = 900;
const HOLD_MS = 700;

type Tool = "select" | (typeof MARKER_KINDS)[number] | (typeof ARROW_KINDS)[number];
const isMarkerTool = (t: Tool): t is (typeof MARKER_KINDS)[number] =>
  (MARKER_KINDS as readonly string[]).includes(t);
const isArrowTool = (t: Tool): t is (typeof ARROW_KINDS)[number] =>
  (ARROW_KINDS as readonly string[]).includes(t);

/**
 * The court diagram: an editor when given `onChange`, read-only otherwise.
 * A diagram can have several steps (lib/diagram-steps.ts); the editor works on
 * one step at a time, and both modes can play the steps as an animation.
 */
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
  const court = courtOf(value);
  const full = court === "full";
  const Yc: YFn = full ? Y_FULL : Y;
  const frames = diagramFrames(value ?? EMPTY_DIAGRAM);
  const [stepRaw, setStep] = useState(0);
  const step = Math.min(stepRaw, frames.length - 1);
  const d = frames[step];
  const multi = frames.length > 1;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const uid = useId().replace(/[:]/g, "");

  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<string | null>(null);

  /* ---- animation between steps ---- */
  const [anim, setAnim] = useState<{ from: number; to: number; t: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);

  const stopAnimation = useCallback(() => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    if (timer.current != null) clearTimeout(timer.current);
    raf.current = null;
    timer.current = null;
    playingRef.current = false;
    setPlaying(false);
    setAnim(null);
  }, []);
  useEffect(() => stopAnimation, [stopAnimation]);

  const reducedMotion = () =>
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /** Slide the markers from step `from` to step `to`, then call `done`.
   *  With reduced motion it jumps straight there. */
  function animate(from: number, to: number, done?: () => void) {
    if (reducedMotion()) {
      setStep(to);
      done?.();
      return;
    }
    const start = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / STEP_MS);
      setAnim({ from, to, t });
      if (t < 1) {
        nextFrame(tick);
      } else {
        raf.current = null;
        setAnim(null);
        setStep(to);
        done?.();
      }
    };
    nextFrame(tick);
  }

  /** The next animation frame, or a short timer if frames stall (a background
   *  tab, some embedded web views), so Play can never hang on "Stop". */
  function nextFrame(cb: () => void) {
    let fired = false;
    const run = () => {
      if (fired) return;
      fired = true;
      if (timer.current != null) clearTimeout(timer.current);
      cb();
    };
    raf.current = requestAnimationFrame(run);
    timer.current = setTimeout(run, 50);
  }

  function next() {
    if (anim || step >= frames.length - 1) return;
    animate(step, step + 1);
  }
  function prev() {
    if (anim) return;
    setStep(Math.max(0, step - 1));
  }
  function play() {
    if (playing) {
      stopAnimation();
      return;
    }
    setPending(null);
    setSelected(null);
    playingRef.current = true;
    setPlaying(true);
    const run = (from: number) => {
      if (!playingRef.current) return;
      if (from >= frames.length - 1) {
        playingRef.current = false;
        setPlaying(false);
        return;
      }
      animate(from, from + 1, () => {
        timer.current = setTimeout(() => run(from + 1), HOLD_MS);
      });
    };
    setStep(0);
    timer.current = setTimeout(() => run(0), HOLD_MS);
  }

  /* ---- editing the current step ---- */
  const busy = anim != null || playing;

  function pointFromEvent(e: { clientX: number; clientY: number }) {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) };
  }

  function commitFrames(nextFrames: DiagramFrame[]) {
    onChange?.({ ...fromFrames(nextFrames), ...(full ? { court: "full" as const } : {}) });
  }

  function setCourt(next: CourtType) {
    if (next === court || !onChange) return;
    const current = value ?? EMPTY_DIAGRAM;
    if (next === "full") {
      onChange(toFullCourt(current));
    } else {
      const { diagram, dropped } = toHalfCourt(current);
      if (dropped > 0 && !window.confirm(`Switch to half court? ${dropped} item${dropped === 1 ? "" : "s"} in the far half will be removed.`)) return;
      onChange(diagram);
    }
    setSelected(null);
    setPending(null);
  }
  function commit(patch: Partial<DiagramFrame>) {
    commitFrames(replaceStep(frames, step, { ...d, ...patch }));
  }

  function onSurfaceClick(e: React.MouseEvent) {
    if (!editable || busy) return;
    const p = pointFromEvent(e);
    if (isMarkerTool(tool)) {
      const label = tool === "player" ? { label: String(d.markers.filter((m) => m.kind === "player").length + 1) } : {};
      commit({ markers: [...d.markers, { id: rid(), kind: tool, x: p.x, y: p.y, ...label }] });
    } else if (isArrowTool(tool)) {
      if (!pending) setPending(p);
      else {
        commit({ arrows: [...d.arrows, { id: rid(), kind: tool, from: pending, to: p }] });
        setPending(null);
      }
    } else {
      setSelected(null);
    }
  }

  function onMarkerPointerDown(e: React.PointerEvent, id: string) {
    if (!editable || busy) return;
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
    commit({ markers: d.markers.map((m) => (m.id === drag.current ? { ...m, x: p.x, y: p.y } : m)) });
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
  function applySet(id: string) {
    const t = templateById(id);
    if (!t) return;
    const what = t.group === "Offence" ? "players and ball" : "defenders";
    if (templateReplacesSomething(d, t) && !window.confirm(`Replace the ${what} on this step with ${t.name}?`)) return;
    commit(applyTemplate(d, t, rid, templateYScale(court)));
    setSelected(null);
    setPending(null);
  }

  function setCurve(curve: number) {
    if (!selected) return;
    commit({ arrows: d.arrows.map((a) => (a.id === selected ? { ...a, curve: curve || undefined } : a)) });
  }
  function setLabel(label: string) {
    if (!selected) return;
    commit({ markers: d.markers.map((m) => (m.id === selected ? { ...m, label: label.slice(0, 3) } : m)) });
  }

  function goToStep(i: number) {
    stopAnimation();
    setSelected(null);
    setPending(null);
    setStep(i);
  }
  function addStep() {
    const nextFrames = addStepAfter(frames, step);
    if (nextFrames === frames) return;
    commitFrames(nextFrames);
    goToStep(step + 1);
  }
  function deleteStep() {
    if (!multi) return;
    commitFrames(removeStep(frames, step));
    goToStep(Math.max(0, step - 1));
  }

  const selectedMarker = d.markers.find((m) => m.id === selected) ?? null;
  const selectedArrow = d.arrows.find((a) => a.id === selected) ?? null;
  const shownMarkers = anim ? interpolateMarkers(frames[anim.from], frames[anim.to], easeInOut(anim.t)) : d.markers;
  const shownArrows = anim ? [] : d.arrows;
  const stepLabel = multi ? `Step ${step + 1} of ${frames.length}.` : "";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {editable && (
        <label className="flex max-w-md items-center gap-2 text-xs font-semibold text-ink-dim">
          Start from a set
          <select
            value=""
            onChange={(e) => applySet(e.target.value)}
            disabled={busy}
            className="min-w-0 flex-1 rounded-control border border-line bg-surface-2 px-2 py-1 text-xs text-ink"
          >
            <option value="">Choose a formation or zone</option>
            {(["Offence", "Defence"] as const).map((group) => (
              <optgroup key={group} label={group === "Offence" ? "Offence (players 1 to 5)" : "Defence (zones)"}>
                {DIAGRAM_TEMPLATES.filter((t) => t.group === group).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}
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
          <ToolButton active={!full} onClick={() => setCourt("half")}>Half court</ToolButton>
          <ToolButton active={full} onClick={() => setCourt("full")}>Full court</ToolButton>
          <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
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
          {selectedArrow && (
            <label className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink-dim">
              Bend
              <input
                type="range"
                min={-1}
                max={1}
                step={0.25}
                value={selectedArrow.curve ?? 0}
                onChange={(e) => setCurve(Number(e.target.value))}
                aria-label="Bend the selected arrow"
                className="w-24 accent-flame"
              />
            </label>
          )}
          <ToolButton onClick={removeSelected} disabled={!selected}>Delete selected</ToolButton>
          <ToolButton
            onClick={() => { commit({ markers: [], arrows: [] }); setSelected(null); setPending(null); }}
            disabled={d.markers.length === 0 && d.arrows.length === 0}
          >
            {multi ? "Clear this step" : "Clear"}
          </ToolButton>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${full ? FULL_H : VB_H}`}
        className={cn(
          "w-full rounded-card border border-line bg-surface-2",
          full ? "max-w-xs" : "max-w-md",
          editable && tool !== "select" && !busy && "cursor-crosshair",
        )}
        role="img"
        aria-label={[editable ? "Court diagram editor." : "", full ? "Full court." : "", stepLabel, describeDiagram(d)].filter(Boolean).join(" ")}
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
        {full && (
          <g transform={`translate(0 ${FULL_H}) scale(1 -1)`}>
            <CourtMarkings />
          </g>
        )}

        {/* arrows: what happens next from this step (hidden while sliding) */}
        {shownArrows.map((a) => (
          <ArrowShape
            key={a.id}
            a={a}
            y={Yc}
            head={`url(#${uid}-head)`}
            selected={selected === a.id}
            onSelect={() => { if (editable && !busy) setSelected(a.id); }}
          />
        ))}

        {/* pending arrow start */}
        {pending && <circle cx={X(pending.x)} cy={Yc(pending.y)} r={4} className="fill-flame" />}

        {/* markers */}
        {/* balls last, so one held by a player is drawn on top of them */}
        {[...shownMarkers.filter((m) => m.kind !== "ball"), ...shownMarkers.filter((m) => m.kind === "ball")].map((m) => (
          <Marker key={m.id} m={m} y={Yc} selected={selected === m.id} onPointerDown={(e) => onMarkerPointerDown(e, m.id)} />
        ))}
      </svg>

      {(editable || multi) && (
        <StepControls
          editable={editable}
          step={step}
          count={frames.length}
          caption={d.caption ?? ""}
          playing={playing}
          busy={busy}
          onStep={goToStep}
          onPrev={prev}
          onNext={next}
          onPlay={play}
          onAdd={addStep}
          onRemove={deleteStep}
          onCaption={(caption) => commit({ caption: caption || undefined })}
        />
      )}

      {/* Announces the step to screen-reader users when it changes. */}
      <p className="sr-only" aria-live="polite">
        {multi && !anim ? `${stepLabel} ${d.caption ?? ""}` : ""}
      </p>

      {editable && (
        <p className="text-xs text-ink-faint">
          {tool === "select"
            ? "Tap a tool, then tap the court to place it. Drag a marker to move it. Arrows need two taps; tap an arrow to bend it."
            : isArrowTool(tool)
              ? pending
                ? "Now tap where the arrow ends."
                : "Tap where the arrow starts."
              : `Tap the court to drop a ${MARKER_LABEL[tool as keyof typeof MARKER_LABEL].toLowerCase()}.`}{" "}
          For a play, draw this step&apos;s movement, then add a step: players start at the ends of their arrows.
        </p>
      )}
    </div>
  );
}

function StepControls({
  editable,
  step,
  count,
  caption,
  playing,
  busy,
  onStep,
  onPrev,
  onNext,
  onPlay,
  onAdd,
  onRemove,
  onCaption,
}: {
  editable: boolean;
  step: number;
  count: number;
  caption: string;
  playing: boolean;
  busy: boolean;
  onStep: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onCaption: (c: string) => void;
}) {
  const multi = count > 1;
  return (
    <div className="flex max-w-md flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Play steps">
        {editable ? (
          <>
            {Array.from({ length: count }, (_, i) => (
              <ToolButton key={i} active={i === step} onClick={() => onStep(i)} label={`Step ${i + 1}`}>
                {i + 1}
              </ToolButton>
            ))}
            <ToolButton onClick={onAdd} disabled={count >= MAX_DIAGRAM_STEPS || busy}>+ Add step</ToolButton>
            {multi && <ToolButton onClick={onRemove} disabled={busy}>Remove step {step + 1}</ToolButton>}
          </>
        ) : (
          <>
            <ToolButton onClick={onPrev} disabled={step === 0 || busy} label="Previous step">←</ToolButton>
            <span className="px-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              Step {step + 1} of {count}
            </span>
            <ToolButton onClick={onNext} disabled={step >= count - 1 || busy} label="Next step">→</ToolButton>
          </>
        )}
        {multi && (
          <ToolButton onClick={onPlay} active={playing}>
            {playing ? "Stop" : "▶ Play"}
          </ToolButton>
        )}
      </div>
      {editable ? (
        <input
          value={caption}
          onChange={(e) => onCaption(e.target.value)}
          maxLength={200}
          placeholder={multi ? "What happens in this step?" : "Optional: describe the set-up"}
          aria-label={`Step ${step + 1} description`}
          className="rounded-control border border-line bg-surface-2 px-2.5 py-1.5 text-sm text-ink"
        />
      ) : (
        caption && <p className="text-sm text-ink-dim">{caption}</p>
      )}
    </div>
  );
}

/**
 * One arrow, drawn in standard play-diagram notation:
 * movement is a plain line, a cut is the same line in the accent colour, a
 * pass is dashed, a dribble dotted, a screen ends in a bar, a handoff carries
 * two ticks across its middle, and a shot ends in a ring instead of a head.
 */
function ArrowShape({
  a,
  y: Yc,
  head,
  selected,
  onSelect,
}: {
  a: CourtDiagram["arrows"][number];
  y: YFn;
  head: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const from = { x: X(a.from.x), y: Yc(a.from.y) };
  const to = { x: X(a.to.x), y: Yc(a.to.y) };
  const curve = a.curve ?? 0;
  const dash = a.kind === "pass" ? "6 5" : a.kind === "dribble" ? "2 4" : undefined;
  const hasHead = a.kind !== "screen" && a.kind !== "shot";
  // A shot is a thin solid line ending in a ring, so it can't be mistaken for a dotted dribble.
  const width = (a.kind === "cut" ? 2.75 : a.kind === "shot" ? 1.25 : 2) + (selected ? 1.5 : 0);
  const endAngle = angleAt(from, to, curve, 1);
  const mid = pointAt(from, to, curve, 0.5);
  const midAngle = angleAt(from, to, curve, 0.5);

  return (
    <g
      className={a.kind === "cut" ? "text-flame-on-bg" : "text-ink-dim"}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* a wider invisible stroke makes thin arrows easy to tap */}
      <path d={arrowPath(from, to, curve)} stroke="transparent" strokeWidth={14} fill="none" />
      <path
        d={arrowPath(from, to, curve)}
        stroke="currentColor"
        strokeWidth={width}
        strokeDasharray={dash}
        strokeLinecap="round"
        fill="none"
        markerEnd={hasHead ? head : undefined}
      />
      {a.kind === "screen" && (
        <line
          x1={to.x} y1={to.y - 10} x2={to.x} y2={to.y + 10}
          stroke="currentColor" strokeWidth={3}
          transform={`rotate(${endAngle} ${to.x} ${to.y})`}
        />
      )}
      {a.kind === "handoff" && (
        <g transform={`rotate(${midAngle} ${mid.x} ${mid.y})`} stroke="currentColor" strokeWidth={2.5}>
          <line x1={mid.x - 3} y1={mid.y - 8} x2={mid.x - 3} y2={mid.y + 8} />
          <line x1={mid.x + 3} y1={mid.y - 8} x2={mid.x + 3} y2={mid.y + 8} />
        </g>
      )}
      {a.kind === "shot" && (
        <circle cx={to.x} cy={to.y} r={7} stroke="currentColor" strokeWidth={2} fill="none" />
      )}
    </g>
  );
}

function ToolButton({
  children,
  active,
  disabled,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** Accessible name when the visible text is a symbol or a bare number. */
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-40",
        active ? "border-flame/40 bg-flame/10 text-flame-on-bg" : "border-line text-ink-dim hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Marker({
  m,
  y: Yc,
  selected,
  onPointerDown,
}: {
  m: CourtDiagram["markers"][number];
  y: YFn;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const cx = X(m.x);
  const cy = Yc(m.y);
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
