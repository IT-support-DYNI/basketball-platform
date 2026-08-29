import { z } from "zod";

export const createFeedbackSchema = z.object({
  playerId: z.number().int().positive(),
  message: z.string().min(1),
  evaluationId: z.number().int().positive().optional(),
  eventId: z.number().int().positive().optional(),
});
