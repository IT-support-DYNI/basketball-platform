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

/** A video is either uploaded (key, a private-bucket key) or linked from
 *  wherever it's already hosted (externalUrl — YouTube, Hudl…) — exactly one
 *  of the two. A linked video plays as an outbound link, same as a player's
 *  external highlight; only an uploaded one gets the inline preview player. */
export const createVideoSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    category: videoCategory,
    key: z.string().min(1).optional(),
    externalUrl: z.string().trim().url().max(500).optional(),
    thumbnailKey: z.string().min(1).optional(),
  })
  .refine((d) => (d.key ? 1 : 0) + (d.externalUrl ? 1 : 0) === 1, {
    message: "Provide either an uploaded video or a link — not both.",
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
