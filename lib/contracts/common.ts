import { z } from "zod";

/**
 * Shared request-shape primitives. The `contracts` package is the single source
 * of truth for validation + types — the same Zod schema validates on the server
 * (route handlers) and, where a form posts to it, drives client-side validation.
 * A future React Native app imports the same schemas.
 */

/** A numeric path/route id, coerced from the string Next gives us. */
export const idParam = z.coerce.number().int().positive();

/** Standard list query: ?page=&pageSize=&sort=&q= (see lib/api/pagination.ts). */
export const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
  q: z.string().trim().optional(),
});
export type ListQuery = z.infer<typeof listQuery>;

/** Date-only string (YYYY-MM-DD). */
export const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

/** Time-of-day string (HH:MM, 24h). */
export const timeOfDay = z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM");
