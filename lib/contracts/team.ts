import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  ageGroup: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  ageGroup: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export const assignCoachSchema = z.object({
  coachProfileId: z.number().int().positive(),
  isPrimary: z.boolean().optional(),
});

/** Admin/Coach adding a player — creates the underlying User + PlayerProfile in one call. */
export const addPlayerToTeamSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  position: z.enum(["PG", "SG", "SF", "PF", "C"]).optional(),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  dateOfBirth: z.string().optional(),
  contactPhone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianContact: z.string().optional(),
});

/** Profile-level fields only. Jersey / position / squad / status are
 *  season-scoped — see updateMembershipSchema in contracts/organisation. */
export const updatePlayerSchema = z.object({
  name: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  photoUrl: z.string().url().optional(),
  contactPhone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianContact: z.string().optional(),
});
