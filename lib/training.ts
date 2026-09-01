import { DRILL_CATEGORIES, DRILL_DIFFICULTIES } from "./contracts/training";

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

export { DRILL_CATEGORIES, DRILL_DIFFICULTIES };
