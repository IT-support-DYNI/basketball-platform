import {
  DRILL_CATEGORIES,
  DRILL_DIFFICULTIES,
  TRAINING_BLOCK_CATEGORIES,
  TRAINING_PLAN_STATUSES,
  MARKER_KINDS,
  ARROW_KINDS,
  type CourtDiagram,
} from "./contracts/training";

/** Client-safe labels for the training domain — no DB imports. */

export const DRILL_CATEGORY_LABEL: Record<(typeof DRILL_CATEGORIES)[number], string> = {
  WARMUP: "Warm-up",
  BALL_HANDLING: "Ball handling",
  PASSING: "Passing",
  SHOOTING: "Shooting",
  FINISHING: "Finishing",
  DEFENSE: "Defense",
  REBOUNDING: "Rebounding",
  TRANSITION: "Transition",
  SET_PLAYS: "Set plays",
  CONDITIONING: "Conditioning",
  SCRIMMAGE: "Scrimmage",
  COOLDOWN: "Cool-down",
  OTHER: "Other",
};

export const DRILL_DIFFICULTY_LABEL: Record<(typeof DRILL_DIFFICULTIES)[number], string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const TRAINING_BLOCK_CATEGORY_LABEL: Record<(typeof TRAINING_BLOCK_CATEGORIES)[number], string> = {
  WARMUP: "Warm-up",
  SKILL: "Skill work",
  TACTICAL: "Tactical",
  CONDITIONING: "Conditioning",
  SCRIMMAGE: "Scrimmage",
  COOLDOWN: "Cool-down",
  OTHER: "Other",
};

export const TRAINING_PLAN_STATUS_LABEL: Record<(typeof TRAINING_PLAN_STATUSES)[number], string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  COMPLETED: "Completed",
};

/** Total planned minutes across a plan's blocks. */
export function planDurationMinutes(blocks: { durationMinutes?: number | null }[]): number {
  return blocks.reduce((n, b) => n + (b.durationMinutes ?? 0), 0);
}

/* ── Court diagram ────────────────────────────────────────────────────── */

export const EMPTY_DIAGRAM: CourtDiagram = { markers: [], arrows: [] };

export const MARKER_LABEL: Record<(typeof MARKER_KINDS)[number], string> = {
  player: "Player",
  opponent: "Defender",
  cone: "Cone",
  ball: "Ball",
  coach: "Coach",
};

export const ARROW_LABEL: Record<(typeof ARROW_KINDS)[number], string> = {
  move: "Movement",
  pass: "Pass",
  dribble: "Dribble",
  screen: "Screen",
};

/** Is there anything drawn? */
export function diagramHasContent(d: CourtDiagram | null | undefined): boolean {
  return !!d && (d.markers.length > 0 || d.arrows.length > 0);
}

/** A short plain-text summary of a diagram — used in the read view and by
 *  screen readers as a fallback for the SVG. */
export function describeDiagram(d: CourtDiagram | null | undefined): string {
  if (!diagramHasContent(d)) return "No court diagram.";
  const counts = new Map<string, number>();
  for (const m of d!.markers) counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1);
  const parts = [...counts].map(([k, n]) => `${n} ${MARKER_LABEL[k as keyof typeof MARKER_LABEL].toLowerCase()}${n === 1 ? "" : "s"}`);
  if (d!.arrows.length) parts.push(`${d!.arrows.length} movement arrow${d!.arrows.length === 1 ? "" : "s"}`);
  return `Court diagram: ${parts.join(", ")}.`;
}

export {
  DRILL_CATEGORIES,
  DRILL_DIFFICULTIES,
  TRAINING_BLOCK_CATEGORIES,
  TRAINING_PLAN_STATUSES,
  MARKER_KINDS,
  ARROW_KINDS,
};
export type { CourtDiagram };
