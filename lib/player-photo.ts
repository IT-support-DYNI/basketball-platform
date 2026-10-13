import { getPlaybackUrl } from "@/lib/storage";

/**
 * Whether a player's current photo is a background-removed cut-out
 * (lib/photo-cutout.ts), shared by every loader that shows one: the public
 * roster and profile (lib/public-site.ts) and the in-app profile hero
 * (lib/player-profile-view.ts).
 *
 * The flag lives on the PlayerPhoto row for that storage key, so it follows
 * the image when a player re-picks an older photo.
 */

/** Include on a PlayerProfile query: just the keys of its cut-out photos. */
export const CUTOUT_PHOTOS = { where: { isCutout: true }, select: { storageKey: true } } as const;

export function isCutoutPhoto(currentKey: string | null | undefined, cutouts: { storageKey: string }[]): boolean {
  return !!currentKey && cutouts.some((p) => p.storageKey === currentKey);
}

/**
 * A stored profile photo is a private-bucket key ("player-photos/<uuid>",
 * or "coach-photos/<uuid>" for staff), never a bare public URL, so it's
 * resolved to a short-lived signed GET on every load, the same rule as
 * video. Null (not the raw key) when it's anything else or storage isn't
 * configured: a broken image is worse than none, and the initials fallback
 * already handles "no photo".
 */
export async function resolvePhotoUrl(stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null;
  if (!stored.startsWith("player-photos/") && !stored.startsWith("coach-photos/")) return null;
  try {
    return await getPlaybackUrl(stored, 3600);
  } catch {
    return null;
  }
}

/** A highlight's playable URL: its external link, or a signed URL for an uploaded clip. */
export async function highlightUrl(h: { url: string | null; storageKey: string | null }): Promise<string> {
  return h.url ?? (h.storageKey ? await getPlaybackUrl(h.storageKey, 3600) : "");
}
