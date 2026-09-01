import { z } from "zod";

const videoCategory = z.enum([
  "SHOOTING",
  "BALL_HANDLING",
  "DEFENSE",
  "PASSING",
  "FINISHING",
  "FITNESS",
  "FOOTWORK",
  "CONDITIONING",
  "GAME_ANALYSIS",
  "OTHER",
]);

export const requestUploadSchema = z.object({
  contentType: z.string().min(1),
});

export const createVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: videoCategory,
  key: z.string().min(1),
  thumbnailKey: z.string().min(1).optional(),
});

export const assignVideoSchema = z
  .object({
    teamIds: z.array(z.number().int().positive()).optional(),
    playerIds: z.array(z.number().int().positive()).optional(),
  })
  .refine(
    (d) => (d.teamIds?.length ?? 0) + (d.playerIds?.length ?? 0) > 0,
    "Assign to at least one team or player"
  );
