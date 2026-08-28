/**
 * Contracts — Zod schemas that are the single source of truth for request
 * validation and the TypeScript types derived from them. Import schemas by name
 * from here; route handlers `.parse()` them and the wrapper (lib/api/route.ts)
 * turns a ZodError into a 422 with per-field details.
 */
import type { z } from "zod";

export * from "./common";
export * from "./auth";

export { createAnnouncementSchema } from "./announcement";
export { bulkAttendanceSchema } from "./attendance";
export { createFeedbackSchema } from "./feedback";
export { createEvaluationSchema, updateEvaluationSchema } from "./performance";
export { pushSubscribeSchema, pushUnsubscribeSchema } from "./push";
export { registerSchema, reviewRegistrationSchema } from "./registration";
export { createSessionSchema, updateSessionSchema } from "./session";
export {
  createTeamSchema,
  updateTeamSchema,
  assignCoachSchema,
  addPlayerToTeamSchema,
  updatePlayerSchema,
} from "./team";
export { createStaffUserSchema, updateUserSchema, setPasswordSchema } from "./user";
export { requestUploadSchema, createVideoSchema, assignVideoSchema } from "./video";

import { createAnnouncementSchema } from "./announcement";
import { bulkAttendanceSchema } from "./attendance";
import { createFeedbackSchema } from "./feedback";
import { createEvaluationSchema, updateEvaluationSchema } from "./performance";
import { registerSchema, reviewRegistrationSchema } from "./registration";
import { createSessionSchema, updateSessionSchema } from "./session";
import {
  createTeamSchema,
  updateTeamSchema,
  assignCoachSchema,
  addPlayerToTeamSchema,
  updatePlayerSchema,
} from "./team";
import { createStaffUserSchema, updateUserSchema, setPasswordSchema } from "./user";
import { requestUploadSchema, createVideoSchema, assignVideoSchema } from "./video";

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ReviewRegistrationInput = z.infer<typeof reviewRegistrationSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AssignCoachInput = z.infer<typeof assignCoachSchema>;
export type AddPlayerToTeamInput = z.infer<typeof addPlayerToTeamSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type AssignVideoInput = z.infer<typeof assignVideoSchema>;
