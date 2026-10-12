/**
 * Render-side guard for user-supplied links. The contracts already reject
 * anything but http(s) on write (lib/contracts/common.ts#httpUrl), but rows
 * saved before that rule existed could still hold a `javascript:` URL, so the
 * few places that put a stored link into an `<a href>` pass it through here.
 */
export function safeExternalHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url.trim()) ? url : undefined;
}
