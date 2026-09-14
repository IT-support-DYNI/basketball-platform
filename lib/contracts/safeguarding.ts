import { z } from "zod";

/** Public safeguarding concern/complaint submission. Everything but the
 *  description itself is optional — a reporter can stay anonymous. */
export const submitSafeguardingReportSchema = z.object({
  reporterName: z.string().trim().max(120).optional(),
  reporterEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
  relationship: z.string().trim().max(120).optional(),
  concernAbout: z.string().trim().max(200).optional(),
  description: z.string().trim().min(10, "Give us a bit more detail so the club can act on this.").max(4000),
});

/** Admin review of a submitted report. */
export const reviewSafeguardingReportSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "RESOLVED"]),
  reviewNotes: z.string().trim().max(4000).optional(),
});
