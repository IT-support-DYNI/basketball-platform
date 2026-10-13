import { z } from "zod";

/**
 * Shared request-shape primitives. The `contracts` package is the single source
 * of truth for validation + types — the same Zod schema validates on the server
 * (route handlers) and, where a form posts to it, drives client-side validation.
 * A future React Native app imports the same schemas.
 */

/** A numeric path/route id, coerced from the string Next gives us. */
export const idParam = z.coerce.number().int().positive();

/** Date-only string (YYYY-MM-DD). */
export const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

/** An outbound link a user typed (highlight, linked video). `z.string().url()`
 *  alone accepts any scheme — including `javascript:` — and these values end
 *  up in an `<a href>`, so only http(s) gets through. */
export const httpUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((u) => /^https?:\/\//i.test(u), "Links must start with http:// or https://");

/** The folders lib/storage.ts#createPresignedUpload issues keys into. */
export type StorageFolder = "videos" | "video-thumbnails" | "player-photos" | "highlight-videos";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** A private-bucket key exactly as the presign step hands it out
 *  (`<folder>/<uuid>`). The server signs a GET URL for whatever key is stored,
 *  so a free-form string here would let a caller point a record at any object
 *  in the bucket — e.g. another player's file or a video they were unassigned
 *  from — and get a fresh playback URL for it. */
export function storageKey(folder: StorageFolder) {
  return z
    .string()
    .trim()
    .regex(new RegExp(`^${folder}/${UUID}$`), "That upload reference isn't valid. Upload the file again.");
}
