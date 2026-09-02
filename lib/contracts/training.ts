import { z } from "zod";

export const DRILL_CATEGORIES = [
  "WARMUP",
  "BALL_HANDLING",
  "PASSING",
  "SHOOTING",
  "FINISHING",
  "DEFENSE",
  "REBOUNDING",
  "TRANSITION",
  "SET_PLAYS",
  "CONDITIONING",
  "SCRIMMAGE",
  "COOLDOWN",
  "OTHER",
] as const;

export const DRILL_DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

const drillCategory = z.enum(DRILL_CATEGORIES);
const drillDifficulty = z.enum(DRILL_DIFFICULTIES);

const shortLines = z.array(z.string().trim().min(1).max(200)).max(20);

/* ── Court diagram ────────────────────────────────────────────────────
 * All coordinates are normalised 0–1 within a half-court box (basket at
 * the top). The shape is owned by components/training/CourtDiagram.
 */
export const MARKER_KINDS = ["player", "opponent", "cone", "ball", "coach"] as const;
export const ARROW_KINDS = ["move", "pass", "dribble", "screen"] as const;
const norm = z.number().min(0).max(1);

export const courtDiagramSchema = z.object({
  markers: z
    .array(
      z.object({
        id: z.string().min(1).max(24),
        kind: z.enum(MARKER_KINDS),
        x: norm,
        y: norm,
        label: z.string().trim().max(3).optional(),
      }),
    )
    .max(30),
  arrows: z
    .array(
      z.object({
        id: z.string().min(1).max(24),
        kind: z.enum(ARROW_KINDS),
        from: z.object({ x: norm, y: norm }),
        to: z.object({ x: norm, y: norm }),
      }),
    )
    .max(30),
});
export type CourtDiagram = z.infer<typeof courtDiagramSchema>;

export const createDrillSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: drillCategory,
  difficulty: drillDifficulty.default("INTERMEDIATE"),
  summary: z.string().trim().max(200).optional(),
  instructions: z.string().trim().max(5000).optional(),
  coachingPoints: shortLines.optional(),
  commonMistakes: shortLines.optional(),
  durationMinutes: z.number().int().min(1).max(180).optional(),
  minPlayers: z.number().int().min(1).max(30).optional(),
  maxPlayers: z.number().int().min(1).max(30).optional(),
  equipment: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  courtDiagram: courtDiagramSchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export const updateDrillSchema = createDrillSchema.partial().extend({
  archived: z.boolean().optional(),
});

/* ── Training plans ───────────────────────────────────────────────────── */

export const TRAINING_BLOCK_CATEGORIES = [
  "WARMUP",
  "SKILL",
  "TACTICAL",
  "CONDITIONING",
  "SCRIMMAGE",
  "COOLDOWN",
  "OTHER",
] as const;

export const TRAINING_PLAN_STATUSES = ["DRAFT", "PUBLISHED", "COMPLETED"] as const;

export const trainingBlockSchema = z.object({
  category: z.enum(TRAINING_BLOCK_CATEGORIES),
  title: z.string().trim().max(120).optional(),
  durationMinutes: z.number().int().min(1).max(180).optional(),
  notes: z.string().trim().max(2000).optional(),
  drillId: z.number().int().positive().nullable().optional(),
});

export const createTrainingPlanSchema = z.object({
  teamId: z.number().int().positive(),
  title: z.string().trim().min(2).max(120),
  objectives: z.string().trim().max(2000).optional(),
  date: z.string().datetime().optional(),
  isTemplate: z.boolean().optional(),
  fromTemplateId: z.number().int().positive().optional(),
  /** The scheduled session this plan is for. */
  eventId: z.number().int().positive().optional(),
});

export const updateTrainingPlanSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  objectives: z.string().trim().max(2000).nullable().optional(),
  date: z.string().datetime().nullable().optional(),
  /** Link (number) or unlink (null) the scheduled session. */
  eventId: z.number().int().positive().nullable().optional(),
  status: z.enum(TRAINING_PLAN_STATUSES).optional(),
  coachingNotes: z.string().trim().max(2000).nullable().optional(),
  effectivenessRating: z.number().int().min(1).max(5).nullable().optional(),
  postSessionNotes: z.string().trim().max(2000).nullable().optional(),
  /** Full replacement of the block list, in order. */
  blocks: z.array(trainingBlockSchema).max(30).optional(),
});
