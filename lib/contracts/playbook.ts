import { z } from "zod";

import { courtDiagramSchema } from "./training";

/** Matches the PlayType enum in prisma/schema.prisma. */
export const PLAY_TYPES = ["OFFENCE", "DEFENCE", "INBOUND", "PRESS_BREAK", "SPECIAL"] as const;

export const createPlaySchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(PLAY_TYPES).default("OFFENCE"),
  notes: z.string().trim().max(5000).optional(),
  courtDiagram: courtDiagramSchema.nullable().optional(),
});

export const updatePlaySchema = createPlaySchema.partial().extend({
  archived: z.boolean().optional(),
});

/** The full set of teams that should have this play. Teams not listed lose it. */
export const setPlayAssignmentsSchema = z.object({
  teamIds: z.array(z.number().int().positive()).max(50),
});

export type CreatePlayInput = z.infer<typeof createPlaySchema>;
export type UpdatePlayInput = z.infer<typeof updatePlaySchema>;
