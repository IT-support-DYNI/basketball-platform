import { z } from "zod";

/** Settings > Display — the two personal preferences saved server-side so
 *  they follow a user across devices (theme itself stays a client-only,
 *  per-device preference — see components/theme/ThemeToggle). */
export const updateDisplayPreferencesSchema = z.object({
  highContrast: z.boolean().optional(),
  fontSizePreference: z.enum(["SMALL", "MEDIUM", "LARGE", "XLARGE"]).optional(),
});
