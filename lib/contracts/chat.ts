import { z } from "zod";

export const createConversationSchema = z.object({
  type: z.enum(["GROUP", "DIRECT"]),
  name: z.string().min(1).max(80).optional(),
  participantUserIds: z.array(z.number().int().positive()).min(1).max(50),
});

export const messageBodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});
