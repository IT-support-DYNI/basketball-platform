import { z } from "zod";

/** Admin provisioning a Coach or a fellow Admin — see ARCHITECTURE.md §6.1. */
export const createStaffUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "COACH"]),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const setPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
