import { z } from "zod";

/**
 * Events — training, matches, meetings, deadlines. Replaces the old
 * training-session contract; `startAt`/`endAt` are ISO datetimes now, not a
 * date + two "HH:MM" strings.
 */

export const EVENT_TYPES = [
  "TRAINING",
  "MATCH",
  "TOURNAMENT",
  "TEAM_MEETING",
  "FITNESS_TEST",
  "SOCIAL",
  "MEDICAL",
  "REGISTRATION_DEADLINE",
  "PAYMENT_DEADLINE",
  "OTHER",
] as const;

export const EVENT_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "POSTPONED"] as const;
export const EVENT_VISIBILITIES = ["TEAM", "CLUB", "PUBLIC"] as const;

const isoDateTime = z.string().datetime({ offset: true });

const eventCore = z.object({
  type: z.enum(EVENT_TYPES).default("TRAINING"),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  teamId: z.number().int().positive().nullable().optional(),
  venueId: z.number().int().positive().nullable().optional(),
  locationText: z.string().max(300).optional(),
  startAt: isoDateTime,
  endAt: isoDateTime,
  arrivalTime: isoDateTime.optional(),
  rsvpDeadline: isoDateTime.optional(),
  capacity: z.number().int().positive().max(1000).nullable().optional(),
  dressCode: z.string().max(200).optional(),
  visibility: z.enum(EVENT_VISIBILITIES).default("TEAM"),
});

export const createEventSchema = eventCore.refine((v) => new Date(v.endAt) > new Date(v.startAt), {
  message: "The event must end after it starts.",
  path: ["endAt"],
});

export const updateEventSchema = eventCore
  .partial()
  .extend({ status: z.enum(EVENT_STATUSES).optional() })
  .refine((v) => !v.startAt || !v.endAt || new Date(v.endAt) > new Date(v.startAt), {
    message: "The event must end after it starts.",
    path: ["endAt"],
  });

export const createVenueSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  mapLat: z.number().min(-90).max(90).nullable().optional(),
  mapLng: z.number().min(-180).max(180).nullable().optional(),
  notes: z.string().max(2000).optional(),
  checkInPin: z.string().regex(/^\d{4,8}$/, "4–8 digits").nullable().optional(),
});

export const updateVenueSchema = createVenueSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
