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
