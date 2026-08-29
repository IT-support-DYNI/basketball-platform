import { z } from "zod";

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

export const bulkAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        playerId: z.number().int().positive(),
        status: z.enum(ATTENDANCE_STATUSES),
        note: z.string().optional(),
      })
    )
    .min(1),
});

/** Player self check-in payload — one of the two must be present. */
export const checkinSchema = z
  .object({
    token: z.string().min(1).optional(),
    pin: z.string().regex(/^\d{4,8}$/).optional(),
  })
  .refine((v) => v.token != null || v.pin != null, { message: "A QR token or venue PIN is required." });

const isoDateTime = z.string().datetime({ offset: true });

/** Coach correction to one AttendanceRecord — the reason is mandatory and
 *  goes into the audit trail. */
export const correctAttendanceSchema = z
  .object({
    status: z.enum(ATTENDANCE_STATUSES).optional(),
    checkInAt: isoDateTime.nullable().optional(),
    checkOutAt: isoDateTime.nullable().optional(),
    note: z.string().max(500).nullable().optional(),
    reason: z.string().min(3).max(300),
  })
  .refine(
    (v) => v.status != null || v.checkInAt !== undefined || v.checkOutAt !== undefined || v.note !== undefined,
    { message: "Nothing to change." },
  );
