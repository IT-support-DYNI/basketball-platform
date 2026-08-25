import { z } from "zod";

export const createAnnouncementSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().min(1),
    scope: z.enum(["PLATFORM", "TEAM"]),
    teamId: z.number().int().positive().optional(),
  })
  .refine(
    (d) => d.scope === "PLATFORM" || d.teamId != null,
    "teamId is required for a TEAM-scoped announcement"
  );
