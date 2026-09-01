# Guardians & the minor branch

Brief §25 — "do not assume every player is an adult". `Club.minorAgeThreshold`
(default 18, configurable) drives everything; `lib/age.ts` (`ageOn`, `isMinor`)
is the one place the comparison lives.

## Registration

`/register` has a **self / guardian** toggle.

- **Self** (`POST /api/v1/register`) — unchanged, but now rejects (400) a DOB
  that makes the applicant a minor for the chosen team's club: *"a parent or
  guardian needs to do it."*
- **Guardian** (`POST /api/v1/register/guardian`) — creates a `GUARDIAN`
  account (logs in), a child `PLAYER` account + `PlayerProfile`
  (`registrationStatus PENDING`), and a `GuardianRelationship` linking them, in
  one transaction. The guardian verifies their own email; the child gets a
  verification link only if an email was supplied, otherwise a
  `child.<rand>@guardian.local` placeholder that can't be signed into
  (guardian-managed) and `mustChangePassword`.

## Guardian area — `/guardian`

- `app/guardian/layout.tsx` — `GUARDIAN`-role gate + `AppContainer`.
- `app/guardian/page.tsx` — one card per linked child (`lib/guardian.ts`
  `childrenOf`): name, relationship, team, `registrationStatus`, any
  admin review note, **outstanding consent count** (links to
  `/consent?child=<playerProfileId>`), and the child's next event.
- `middleware.ts` — `GUARDIAN` → home `/guardian`, prefix `/guardian`; a
  guardian hitting `/player/*` is redirected to `/guardian`.
- Nav — capability `guardian.home`, one item ("My children").

## Consent for a child

`/consent?child=<id>` resolves the subject via
`resolveConsentSubject` (guardian → a linked child only) and `ConsentForm`
submits with `playerProfileId`, writing `ConsentRecord.byGuardian = true`.
Accepting clears the badge on the dashboard.

## Seed

`guardian@example.com` / `child@example.com` (Kit Guardian, PENDING, U16, two
consent docs outstanding until accepted).

## Still to come (W6)

- Part 4 — resumable multi-step registration (server-saved draft).
- Later: a guardian's own read-only view of a child's schedule / attendance;
  the safeguarding messaging rules (`ClubSafeguardingPolicy`).
