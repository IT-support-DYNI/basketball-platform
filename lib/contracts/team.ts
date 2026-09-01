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
  dateOfBirth: z.string().nullable().optional(),
  photoUrl: z.string().url().optional(),
  contactPhone: z.string().max(40).optional(),
  guardianName: z.string().max(120).optional(),
  guardianContact: z.string().max(40).optional(),
  nationality: z.string().max(60).optional(),
  heightCm: z.number().int().min(80).max(260).optional(),
  preferredHand: z.enum(["LEFT", "RIGHT", "AMBIDEXTROUS"]).optional(),
  bio: z.string().max(1000).optional(),
  address: z.string().max(300).optional(),
  emergencyContactName: z.string().max(120).optional(),
  emergencyContactPhone: z.string().max(40).optional(),
  emergencyContactRelation: z.string().max(60).optional(),
  medicalNotes: z.string().max(2000).optional(),
  welfareNotes: z.string().max(2000).optional(),
  publicProfileApproved: z.boolean().optional(),
});
