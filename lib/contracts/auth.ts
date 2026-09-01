import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

/** A TOTP code or a recovery code. */
export const mfaCodeSchema = z.object({
  code: z.string().trim().min(6).max(20),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;
