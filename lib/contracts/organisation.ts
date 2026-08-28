import { z } from "zod";

import { dateOnly } from "./common";

const position = z.enum(["PG", "SG", "SF", "PF", "C"]);
const membershipStatus = z.enum([
  "PENDING",
  "ACTIVE",
  "INJURED",
  "SUSPENDED",
  "INACTIVE",
  "TRIALIST",
  "FORMER",
]);

export const createSeasonSchema = z
  .object({
    name: z.string().min(1),
    startDate: dateOnly,
    endDate: dateOnly,
    isActive: z.boolean().optional(),
  })
  .refine((s) => s.startDate <= s.endDate, {
    message: "The season can't end before it starts.",
    path: ["endDate"],
  });

export const updateSeasonSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: dateOnly.optional(),
  endDate: dateOnly.optional(),
  isActive: z.boolean().optional(),
});

export const createSquadSchema = z.object({
  name: z.string().min(1),
  ageGroup: z.string().optional(),
  seasonId: z.number().int().positive().optional(),
});

export const updateSquadSchema = z.object({
  name: z.string().min(1).optional(),
  ageGroup: z.string().nullable().optional(),
});

/** Add a player to a team's roster for the active season. */
export const addMembershipSchema = z.object({
  playerProfileId: z.number().int().positive(),
  jerseyNumber: z.number().int().min(0).max(99).nullable().optional(),
  position: position.nullable().optional(),
  secondaryPosition: position.nullable().optional(),
  squadId: z.number().int().positive().nullable().optional(),
  status: membershipStatus.optional(),
});

export const updateMembershipSchema = z.object({
  jerseyNumber: z.number().int().min(0).max(99).nullable().optional(),
  position: position.nullable().optional(),
  secondaryPosition: position.nullable().optional(),
  squadId: z.number().int().positive().nullable().optional(),
  status: membershipStatus.optional(),
});

export const assignStaffSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum([
    "HEAD_COACH",
    "ASSISTANT_COACH",
    "TEAM_MANAGER",
    "STATISTICIAN",
    "MEDICAL_OFFICER",
    "WELFARE_OFFICER",
  ]),
  seasonId: z.number().int().positive().nullable().optional(),
});

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
export type CreateSquadInput = z.infer<typeof createSquadSchema>;
export type UpdateSquadInput = z.infer<typeof updateSquadSchema>;
export type AddMembershipInput = z.infer<typeof addMembershipSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
