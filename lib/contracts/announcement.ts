import { z } from "zod";

export const createAnnouncementSchema = z
  .object({
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(8000),
    scope: z.enum(["PLATFORM", "TEAM"]),
    teamId: z.number().int().positive().optional(),
    requiresAck: z.boolean().default(false),
    /** ISO datetime; the announcement stays pinned to the top until then. */
    pinnedUntil: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (d) => d.scope === "PLATFORM" || d.teamId != null,
    "teamId is required for a TEAM-scoped announcement",
  );
