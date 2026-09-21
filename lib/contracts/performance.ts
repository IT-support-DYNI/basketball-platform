import { z } from "zod";

export const createEvaluationSchema = z.object({
  playerId: z.number().int().positive(),
  periodType: z.enum(["WEEKLY", "MONTHLY"]),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  categoryScores: z
    .array(
      z.object({
        categoryId: z.number().int().positive(),
        score: z.number().int().min(1).max(10),
      })
    )
    .min(1)
    .refine(
      (scores) => new Set(scores.map((s) => s.categoryId)).size === scores.length,
      "Each category can only be scored once per evaluation"
    ),
  /** Monthly evaluations only — see ARCHITECTURE.md §2.2. */
  strengths: z.string().optional(),
  developmentAreas: z.string().optional(),
});

export const updateEvaluationSchema = createEvaluationSchema
  .omit({ playerId: true, periodType: true })
  .partial();

/** Platform-wide settings > Performance categories (admin-managed). */
export const createPerformanceCategorySchema = z.object({
  label: z.string().trim().min(1).max(60),
});

export const updatePerformanceCategorySchema = z.object({
  label: z.string().trim().min(1).max(60).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
