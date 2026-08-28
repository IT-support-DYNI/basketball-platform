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

export const reviewRegistrationSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
  note: z.string().optional(),
  /// Required when approving — self-registrants pick an intended team, but
  /// an admin confirms/reassigns it at approval time.
  teamId: z.number().int().positive().optional(),
});
