/**
 * Contracts — Zod schemas that are the single source of truth for request
 * validation and the TypeScript types derived from them. Import schemas by name
 * from here; route handlers `.parse()` them and the wrapper (lib/api/route.ts)
 * turns a ZodError into a 422 with per-field details.
 */
import type { z } from "zod";

export * from "./common";
export * from "./auth";
export * from "./organisation";

export { createAnnouncementSchema } from "./announcement";
export { deleteAccountSchema } from "./account";
export { createConversationSchema, messageBodySchema } from "./chat";
export { createDrillSchema, updateDrillSchema, DRILL_CATEGORIES, DRILL_DIFFICULTIES } from "./training";
export {
  createConsentDocumentSchema,
  updateConsentDocumentSchema,
  publishConsentVersionSchema,
  acceptConsentSchema,
} from "./consent";
export { bulkAttendanceSchema, checkinSchema, correctAttendanceSchema } from "./attendance";
export { createFeedbackSchema } from "./feedback";
export { createEvaluationSchema, updateEvaluationSchema } from "./performance";
export { pushSubscribeSchema, pushUnsubscribeSchema } from "./push";
export { registerSchema, registerGuardianSchema, startDraftSchema, patchDraftSchema, reviewRegistrationSchema } from "./registration";
export {
  createEventSchema,
  updateEventSchema,
  createVenueSchema,
  updateVenueSchema,
  rsvpSchema,
} from "./event";
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
import { deleteAccountSchema } from "./account";
import { createConversationSchema, messageBodySchema } from "./chat";
import { createDrillSchema, updateDrillSchema } from "./training";
import { bulkAttendanceSchema, checkinSchema, correctAttendanceSchema } from "./attendance";
import { createFeedbackSchema } from "./feedback";
import { createEvaluationSchema, updateEvaluationSchema } from "./performance";
import { registerSchema, registerGuardianSchema, reviewRegistrationSchema } from "./registration";
import {
  createEventSchema,
  updateEventSchema,
  createVenueSchema,
  updateVenueSchema,
  rsvpSchema,
} from "./event";
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
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type CreateDrillInput = z.infer<typeof createDrillSchema>;
export type UpdateDrillInput = z.infer<typeof updateDrillSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type MessageBodyInput = z.infer<typeof messageBodySchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type CorrectAttendanceInput = z.infer<typeof correctAttendanceSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterGuardianInput = z.infer<typeof registerGuardianSchema>;
export type ReviewRegistrationInput = z.infer<typeof reviewRegistrationSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
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
