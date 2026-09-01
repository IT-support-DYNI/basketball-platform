import { z } from "zod";

export const CONSENT_DOCUMENT_TYPES = [
  "CODE_OF_CONDUCT",
  "PRIVACY_NOTICE",
  "MEDIA_CONSENT",
  "MEDICAL_CONSENT",
  "DATA_PROCESSING",
  "TRIP_CONSENT",
  "OTHER",
] as const;

export const createConsentDocumentSchema = z.object({
  type: z.enum(CONSENT_DOCUMENT_TYPES),
  title: z.string().min(2).max(120),
  body: z.string().min(10).max(20000),
  requiredForPlayers: z.boolean().default(true),
});

export const updateConsentDocumentSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  requiredForPlayers: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const publishConsentVersionSchema = z.object({
  body: z.string().min(10).max(20000),
});

export const acceptConsentSchema = z.object({
  versionIds: z.array(z.number().int().positive()).min(1).max(50),
  /** A guardian passes the child's profile id; a player omits it (defaults to self). */
  playerProfileId: z.number().int().positive().optional(),
});
