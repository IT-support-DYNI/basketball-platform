import { z } from "zod";

export const deleteAccountSchema = z.object({
  /** Current password — re-authentication for an irreversible action. */
  password: z.string().min(1, "Enter your password to confirm."),
  /** The user must type DELETE, so a stray click can't erase an account. */
  confirm: z.literal("DELETE"),
});
