import { z } from "zod";

/** Public self-registration — DYNI Blazers PRD §6, Journey A. */
export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  teamId: z.number().int().positive(),
  position: z.enum(["PG", "SG", "SF", "PF", "C"]).optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  contactPhone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianContact: z.string().optional(),
  /// Must be explicitly true — the checkbox is not pre-checked client-side.
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the club's registration terms to continue" }),
  }),
});

/** Guardian-led registration for a minor (brief §25). Creates a GUARDIAN
 *  account that logs in + a child PLAYER account it manages. */
export const registerGuardianSchema = z.object({
  guardianName: z.string().min(1),
  guardianEmail: z.string().email(),
  guardianPassword: z.string().min(8, "Password must be at least 8 characters"),
  guardianPhone: z.string().max(40).optional(),
  relationshipLabel: z.string().min(2).max(60),

  childName: z.string().min(1),
  childEmail: z.string().email().optional(),
  childDateOfBirth: z.string().min(1, "Your child's date of birth is required"),
  teamId: z.number().int().positive(),
  position: z.enum(["PG", "SG", "SF", "PF", "C"]).optional(),

  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the club's registration terms to continue" }),
  }),
});

/* --- Resumable multi-step registration (server-saved draft) --- */

export const REGISTRATION_MODES = ["self", "guardian"] as const;

export const startDraftSchema = z.object({
  email: z.string().email(),
  mode: z.enum(REGISTRATION_MODES),
});

export const patchDraftSchema = z.object({
  currentStep: z.number().int().min(1).max(6).optional(),
  /** Partial form values for this step; merged into the draft. */
  data: z.record(z.unknown()).optional(),
});

export const reviewRegistrationSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
  note: z.string().optional(),
  /// Required when approving — self-registrants pick an intended team, but
  /// an admin confirms/reassigns it at approval time.
  teamId: z.number().int().positive().optional(),
});
