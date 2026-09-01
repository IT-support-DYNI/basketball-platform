/**
 * Age helpers. "Minor" is club-configurable (`Club.minorAgeThreshold`) because
 * the age of majority and the guardian-consent age differ by jurisdiction and
 * federation — never hardcode "under 18" (brief §25).
 */

/** Whole years old on `on` (default: today). */
export function ageOn(dateOfBirth: Date, on: Date = new Date()): number {
  let age = on.getFullYear() - dateOfBirth.getFullYear();
  const m = on.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}

/** True if the person is at or under the club's minor threshold. */
export function isMinor(dateOfBirth: Date, minorAgeThreshold: number, on: Date = new Date()): boolean {
  return ageOn(dateOfBirth, on) < minorAgeThreshold;
}
