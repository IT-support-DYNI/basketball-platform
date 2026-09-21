/** Machine key from an admin-entered label — e.g. "Ball IQ" -> "BALL_IQ".
 *  Immutable once a PerformanceCategoryDefinition row exists; only used at
 *  creation time. */
export function categoryKeyFromLabel(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
