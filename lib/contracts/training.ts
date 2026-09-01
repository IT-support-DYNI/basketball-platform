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
  courtDiagram: z.unknown().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export const updateDrillSchema = createDrillSchema.partial().extend({
  archived: z.boolean().optional(),
});
