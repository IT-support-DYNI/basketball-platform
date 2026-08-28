import { z } from "zod";

export const bulkAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        playerId: z.number().int().positive(),
        status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
        note: z.string().optional(),
      })
    )
    .min(1),
});
