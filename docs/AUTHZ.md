# Authorization

Two layers (ARCHITECTURE.md §3.2), one engine.

```
session ──roleAssignmentsFor()──▶ RoleAssignment[]  ──defineAbilityFor()──▶ CASL ability
   │                                                                            │
   └── requireRole()  (layer 1: does the caller hold this role?)                │
                                                                                ▼
                        authorize(session).can(action, subject, resource)  ◀── layer 2
                        requireAbility(session, action, subject, resource)      (resource + field rules)
```

## Files (`lib/authz/`)

| File | Role |
|---|---|
| `roles.ts` | The 11 roles, `Scope`, and `roleAssignmentsFor(session)` — maps today's single `User.role` onto scoped assignments. **When the `UserRole` join table migration lands, only this file changes.** |
| `ability.ts` | The policy. `defineAbilityFor(principal)` builds a CASL `MongoAbility` from the assignments. One `switch` per role; `PlayerContact` / `PlayerMedical` / `PlayerWelfare` are separate subjects so the field-visibility engine (W5) reads off the same rules. |
| `guard.ts` | `authorize()`, `requireAbility()`, and the back-compat helpers (`requireRole`, `requireTeamAccess`, `requirePlayerAccess`, `canViewPlayerContactDetails`, `requireAuth`, `isAdmin`) — all now one engine. |
| `ability.test.ts` | The permission matrix — every role × subject × action, allow and deny, cross-team and cross-tenant negatives. |

`lib/authorization.ts` re-exports `lib/authz/guard` so the ~34 route handlers that import `@/lib/authorization` are unchanged.

## Writing a check in a route

```ts
import { requireAuth, requireRole, authorize, requireAbility } from "@/lib/authorization";

const session = requireAuth(await getServerSession(authOptions));

// layer 1 — coarse role gate
requireRole(session, ["COACH"]);

// layer 2 — resource rule (throws ForbiddenError -> 403)
requireAbility(session, "record", "Attendance", { teamId: trainingSession.teamId });

// or as a boolean, e.g. for field filtering
const showContact = authorize(session).can("read", "PlayerContact", { id: player.id, teamId: player.teamId });
```

## Actions & subjects

Actions: `manage` `create` `read` `update` `delete` `access` `record` `verify`
`approve` `moderate` `export`.

Subjects: `Team` `PlayerProfile` `PlayerContact` `PlayerMedical` `PlayerWelfare`
`TrainingSession` `Attendance` `Announcement` `Video` `Evaluation` `Feedback`
`Notification` `User` `Registration` `Club` `all`.

## Auth hardening (W3 part 2)

Shipped (migration `20260828121321_auth_hardening`):

| Feature | Where |
|---|---|
| Email verification | `AuthToken` (type `EMAIL_VERIFICATION`), `User.emailVerifiedAt`. Link emailed on register; `POST /api/v1/auth/verify-email`, `/auth/resend-verification`. An admin **can't approve** an unverified registration. `/verify-email` page. |
| Password reset | `AuthToken` (type `PASSWORD_RESET`, 30-min TTL). `POST /api/v1/auth/forgot-password` (always 200 — no account enumeration), `/auth/reset-password`. `/forgot-password` + `/reset-password` pages. |
| Brute-force lockout | `LoginAttempt` table. 5 failures in 15 min locks the email for the rest of the window, **even once the password is right**. Enforced in `authOptions.authorize`; the sign-in page reads `GET /api/v1/auth/login-status` to show "try again in N minutes". `lib/login-throttle.ts` (`computeLockout` is pure + unit-tested). |
| Single-use tokens | Only the SHA-256 hash is stored (`lib/auth-tokens.ts`); `consumeAuthToken` validates + marks used atomically. |
| Email port | `lib/mail/` — `MailPort` interface + `ConsoleMailAdapter` (logs the link; the free-tier / dev default). Real adapter plugs in at `lib/mail/index.ts`, `MAIL_TRANSPORT` env. |

### MFA + device sessions (W3 part 3)

Shipped (migration `20260828123402_mfa_and_sessions`): `AuthSession`, `UserMfa`.

| Feature | Where |
|---|---|
| **TOTP MFA** | `lib/totp.ts` — RFC 6238, hand-rolled on Node `crypto` (no OTP dependency), unit-tested against the RFC vectors. `lib/mfa.ts` — enrollment, 10 bcrypt-hashed recovery codes (consumed one-per-use). Endpoints `GET/POST /api/v1/auth/mfa`, `/mfa/setup`, `/mfa/enable`, `/mfa/disable`. Voluntary for all; the settings page nudges admins (Doc 6 §19.5). |
| **Login step-up** | `authOptions.authorize`: password OK + MFA on → needs a `totp` credential. Missing → throws `MFA_REQUIRED`; wrong → `MFA_INVALID` (NextAuth v4 surfaces both to the client). The sign-in page shows a code field on the second step. |
| **Device sessions** | `lib/auth-sessions.ts`. `authorize` creates an `AuthSession` (UA + hashed IP) and puts its `tokenId` in the JWT as `sid`; the jwt callback checks it every request — revoked → `isActive:false` → logged out next request. Endpoints `GET /api/v1/auth/sessions`, `DELETE /auth/sessions/:id`, `POST /auth/sessions/revoke-others`. A password reset revokes every session. |
| **"Refresh rotation"** | JWT `maxAge` 7 d / `updateAge` 1 d (re-issue), and the `AuthSession` check is the revocation half — the practical equivalent for a credentials + JWT setup (brief §4's "where applicable"). |
| **Settings UI** | `/settings/security` — MFA enable/disable + recovery codes, signed-in device list with per-device and "sign out all others". Linked from every role's nav. |

Verified end to end: MFA setup → enable → sign out → step-up login (bad code
rejected, good code in) → revoke another device → revoke own device → next
request 401.
