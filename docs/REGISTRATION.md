# Registration

Public, unauthenticated. An admin reviews every submission
(`PlayerProfile.registrationStatus`) before full access; middleware routes a
non-`APPROVED` player to `/registration-status` and a `GUARDIAN` to `/guardian`.

## Shared creation logic — `lib/registration.ts`

`createSelfRegistration(input)` and `createGuardianRegistration(input)` are the
single implementation of "make the account(s)". All three entry points call
them, so validation, the audit row and the verification email can't drift:

| Entry point | Route |
|---|---|
| Direct self | `POST /api/v1/register` |
| Direct guardian | `POST /api/v1/register/guardian` |
| Multi-step draft submit | `POST /api/v1/registration/draft/submit` |

Rules enforced: email not already an account; team ACTIVE; a self-registrant
whose DOB is under `Club.minorAgeThreshold` is refused (`lib/age.ts`).

## Resumable multi-step draft — W6 part 4

The applicant has no account yet, so a `RegistrationDraft` is keyed by the
primary email + an unguessable `resumeToken` (an httpOnly `reg_draft` cookie;
migration `20260901160000_registration_draft`).

- `POST /api/v1/registration/draft` `{ email, mode }` — begin or resume; sets
  the cookie. 409 if a real account already has that email.
- `GET /api/v1/registration/draft` — the draft for the cookie (or 404).
- `PATCH /api/v1/registration/draft` `{ currentStep?, data? }` — `data` is
  merged into the accumulated form values.
- `POST /api/v1/registration/draft/submit` — assembles `data`, validates it
  against `registerSchema` / `registerGuardianSchema`, creates the account(s),
  marks the draft `SUBMITTED`, clears the cookie.
- `lib/registration-draft.ts` holds the logic; drafts expire after 30 days.

`/register` is a 5-step stepper (`Account → About you / Your child → Team →
Agreement → Review`) that PATCHes on each "Continue" and, on load, `GET`s any
in-progress draft and jumps to its saved step. Middleware allows
`/api/v1/registration/` through unauthenticated.

## W6 complete

Field-visibility (part 1), consent gate (part 2), guardians & the minor branch
(part 3), resumable registration (part 4). See docs/FIELD-VISIBILITY.md and
docs/GUARDIANS.md.
