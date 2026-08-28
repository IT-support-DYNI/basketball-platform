import { z } from "zod";

const performanceCategory = z.enum([
  "SHOOTING",
  "DEFENSE",
  "PASSING",
  "BALL_HANDLING",
  "FITNESS",
  "TEAMWORK",
  "EFFORT",
  "DISCIPLINE",
]);

export const createEvaluationSchema = z.object({
  playerId: z.number().int().positive(),
  periodType: z.enum(["WEEKLY", "MONTHLY"]),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  categoryScores: z
    .array(
      z.object({
        category: performanceCategory,
        score: z.number().int().min(1).max(10),
      })
    )
    .min(1)
    .refine(
      (scores) => new Set(scores.map((s) => s.category)).size === scores.length,
      "Each category can only be scored once per evaluation"
    ),
  /** Monthly evaluations only — see ARCHITECTURE.md §2.2. */
  strengths: z.string().optional(),
  developmentAreas: z.string().optional(),
});

export const updateEvaluationSchema = createEvaluationSchema
  .omit({ playerId: true, periodType: true })
  .partial();
