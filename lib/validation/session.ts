import { z } from "zod";

const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM");

export const createSessionSchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional(),
  date: z.string().min(1),
  startTime: timeString,
  endTime: timeString,
  location: z.string().min(1),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  date: z.string().min(1).optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  location: z.string().min(1).optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
});
