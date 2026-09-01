import {
  DRILL_CATEGORIES,
  DRILL_DIFFICULTIES,
  TRAINING_BLOCK_CATEGORIES,
  TRAINING_PLAN_STATUSES,
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

export { DRILL_CATEGORIES, DRILL_DIFFICULTIES, TRAINING_BLOCK_CATEGORIES, TRAINING_PLAN_STATUSES };
