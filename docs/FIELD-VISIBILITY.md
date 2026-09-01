# Field-level visibility

Brief §7, §33 · Doc 4 §12.2. RBAC decides *which records* a caller can touch;
this decides *which fields of a player record* they see. The API strips fields
**server-side** before the response leaves — the frontend is never trusted to
hide a field it received, so no amount of URL/param tampering exposes private
data (requirement 7).

## The engine — `lib/authz/field-visibility.ts`

- **`ViewerKind`** — `SELF` (player or a linked guardian) · `PUBLIC` · `CLUB_MEMBER`
  · `TEAMMATE` · `TEAM_COACH` · `TEAM_WELFARE` · `TEAM_MEDICAL` · `ADMIN`.
- **`PLAYER_FIELD_VIEWERS`** — `{ field: ViewerKind[] }`. A field not listed is
  always returned (id, name, memberships…). `medicalNotes` and `welfareNotes`
  are siblings, not a hierarchy — a medical officer does **not** see welfare
  notes and vice versa.
- **`resolvePlayerViewerScope(session, player)`** — one DB round-trip
  (`StaffAssignment` roles on the player's teams, plus a `GuardianRelationship`
  check for guardians) → the `Set<ViewerKind>` the caller holds.
- **`serializePlayerProfile(profile, scope)`** — returns a copy with every
  field the scope can't see removed. `PUBLIC` is additionally gated by
  `publicProfileApproved`.
- **`canEditPlayerField(scope, field)`** — write gate; medical/welfare notes are
  locked to the matching officer, an admin, or the player/guardian.

When a per-club `FieldVisibilityPolicy` table lands it replaces
`PLAYER_FIELD_VIEWERS`, not the call sites.

## Who sees what (default policy)

| Field group | Sees it |
|---|---|
| name, memberships, jersey/position (via membership) | everyone authenticated |
| bio | + PUBLIC when `publicProfileApproved` |
| nationality, height, preferred hand | club members + staff + admin + self |
| DOB, phone, guardian name/contact, emergency contact | the player's **coaches** + welfare + medical + admin + self/guardian |
| address | welfare + admin + self/guardian |
| medical notes | **medical officer** of the player's team + admin + self/guardian |
| welfare notes | **welfare officer** of the player's team + admin + self/guardian |

## Wired into

- `GET /api/v1/players/{id}` — no hard access gate (any member may look a player
  up); the engine does all the gating. Verified: teammate → name+bio+height
  only; coach → +contact/DOB/emergency; welfare → +address+welfare notes;
  medical → +medical notes; admin/self → everything.
- `PATCH /api/v1/players/{id}` — `canEditPlayerField` per field; a coach editing
  `medicalNotes` gets 403.
- Player self-service form: `components/player/EditProfileForm.tsx`.

The team roster (`GET /api/v1/teams/{id}/players`) still uses the coarser
`canViewPlayerContactDetails` (admin + the team's coaches) — fine for that list;
migrate it to the engine if a welfare/medical roster view is needed.

## Consent gate (W6 part 2)

Migration `20260901130000_consent`. `ConsentDocument` → ordered
`ConsentDocumentVersion`s (latest = current) → append-only `ConsentRecord`
(one per player per version, `acceptedByUserId` + `byGuardian`).

- `lib/consent.ts` — `consentStatusFor` / `outstandingConsents` /
  `hasOutstandingConsent` / `acceptConsent` / `publishConsentVersion` /
  `resolveConsentSubject` (player → self; guardian → a linked child).
- Admin: `GET|POST /api/v1/consent-documents`, `PATCH …/{id}` (rename / retire /
  toggle required), `POST …/{id}/versions`. UI at `/admin/consent`
  (`components/admin/ConsentManager.tsx`), nav cap `admin.consent`.
- Player/guardian: `GET /api/v1/consent`, `POST /api/v1/consent/accept`
  (rejects stale/superseded version ids with 400). UI at `/consent`
  (`components/consent/ConsentForm.tsx`).
- **Gate**: `app/player/layout.tsx` redirects an APPROVED player with any
  outstanding *required* document to `/consent`. Publishing a new version
  re-gates everyone.

Verified: gate redirects → accept clears it → publishing v2 re-gates →
accepting a stale version id is refused.

## Still to come (W6)

- Guardian accounts + the minor registration branch (`Club.minorAgeThreshold`).
- Resumable multi-step registration (server-saved draft).
