/**
 * Club-history edits on a player profile, as a pure function so the rules
 * are unit-tested (lib/club-history.test.ts). They match registration
 * (lib/contracts/registration.ts) and the database check
 * PlayerProfile_previous_clubs_needs_yes:
 *
 *  - "Yes" needs the club named (at least 2 characters).
 *  - "No" clears any club name.
 *  - A club name on its own is checked against the stored answer, so it
 *    can't sit under a "no" or be blanked under a "yes".
 */

export const MIN_CLUB_NAME = 2;

type Stored = { hasPreviousClub: boolean | null; previousClubs: string | null };
type Body = { hasPreviousClub?: boolean; previousClubs?: string | null };

export type ClubHistoryResult =
  | { ok: true; data: { hasPreviousClub?: boolean; previousClubs?: string | null } }
  | { ok: false; error: string };

export function clubHistoryUpdate(stored: Stored, body: Body): ClubHistoryResult {
  if (body.hasPreviousClub === undefined && body.previousClubs === undefined) return { ok: true, data: {} };

  const answerSent = body.hasPreviousClub !== undefined;
  const answer = body.hasPreviousClub ?? stored.hasPreviousClub;

  if (answer !== true) {
    if (body.previousClubs?.trim()) {
      return { ok: false, error: "Answer yes to having played for another club before naming it." };
    }
    return { ok: true, data: { ...(answerSent ? { hasPreviousClub: false } : {}), previousClubs: null } };
  }

  const clubs = (body.previousClubs === undefined ? stored.previousClubs : body.previousClubs)?.trim() ?? "";
  if (clubs.length < MIN_CLUB_NAME) return { ok: false, error: "Name the previous club (or clubs)." };

  return { ok: true, data: { ...(answerSent ? { hasPreviousClub: true } : {}), previousClubs: clubs } };
}
