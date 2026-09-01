# Security posture

Phase 1 hardening pass (build plan W8). Covers what the platform enforces today
and what is deliberately deferred.

## Response headers

Set for every route in `next.config.mjs#headers()`:

| Header | Value | Why |
| --- | --- | --- |
| `Content-Security-Policy` | see below | Limits script/style/connect origins; kills framing, `<base>` and plugin injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS (no effect on plain-HTTP localhost) |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking (belt-and-braces with `frame-ancestors 'none'`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Don't leak full URLs off-site |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=(), browsing-topics=(), payment=()` | `camera=self` for the QR check-in screen; everything else off |
| `X-DNS-Prefetch-Control` | `off` | No implicit DNS lookups |

**CSP** — `default-src 'self'` with `img-src 'self' data: blob:`, `font-src
'self'` (fonts are self-hosted by `next/font`), `connect-src 'self'`,
`worker-src / media-src 'self' blob:`, `frame-ancestors 'none'`, `object-src
'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.

Known gap: `script-src` still allows `'unsafe-inline'` (and `'unsafe-eval'` in
dev). Next's hydration bootstrap and the pre-paint `ThemeScript` are inline. The
fix is a per-request nonce set in `middleware.ts` and threaded into the inline
`<script>`; tracked as a follow-up. The other CSP directives already close the
main injection vectors in the meantime.

## Authorization / IDOR

Two layers (unchanged from `AUTHZ.md`): `middleware.ts` does a coarse
role-area redirect for page navigation; every `/api/v1` route re-checks
authorization itself against the *fetched* resource, never against the URL id
alone.

W8 IDOR sweep — spot-checked the object-scoped mutation routes, all follow the
same fetch-then-authorize shape:

| Route | Check |
| --- | --- |
| `notifications/{id}/read` | `notification.userId === caller` |
| `evaluations/{id}` GET/PATCH | `requirePlayerAccess` (caller coaches the player's team, or is the player/guardian) |
| `attendance/{id}` PATCH | `authorize().can("record","Attendance",{teamId})` |
| `memberships/{id}` PATCH | `requireAbility` on the membership's team |
| `conversations/{id}` + `messages/{id}` | `requireParticipant` / author-or-admin |
| `players/{id}` | field-visibility engine strips per viewer (`FIELD-VISIBILITY.md`) |
| `announcements/{id}/acks` | author / team coach / admin only |

No fixes were needed. New routes must keep the pattern: `findUnique` →
authorize against a field on the row (owner id, `teamId`), then act.

## Rate limiting

- **Sign-in** — DB-backed (`LoginAttempt` + `lib/login-throttle.ts`): 5 failures
  per email in 15 minutes locks that email out; `computeLockout` is pure and
  unit-tested. Survives multiple serverless instances because the counter is in
  Postgres, not memory.
- **Everything else** — not rate-limited yet. The unauthenticated write surface
  is small (registration draft/submit, password reset, email verification) and
  each has its own abuse-limiting property (reset/verify are single-use hashed
  tokens; registration is idempotent per email + gated by an admin approval
  before it grants any access). A general limiter (same `LoginAttempt`-style
  table, or Upstash if the budget opens up) is a fast follow if needed.

## Account data — access & erasure (brief §32–33)

Self-service, on `/settings/account`:

- **Export** — `GET /api/v1/account/export` returns a JSON file of everything
  held *about* the caller: profile, memberships, consent records, RSVPs,
  attendance, evaluations, feedback, messages they authored, notifications,
  sessions and the audit trail of their own actions. Logged as
  `ACCOUNT_EXPORTED`.
- **Deletion** — `DELETE /api/v1/account`, re-authenticated with the current
  password and a typed `DELETE` confirmation. It **anonymises** rather than
  hard-deletes (`lib/account.ts#anonymiseAccount`): a player's attendance,
  evaluations and messages are records other people's history depends on, so
  the personal data is scrubbed (`anonymisedUserFields` /
  `anonymisedPlayerProfileFields`) and the rows are kept under legitimate
  interest. Credentials, MFA secrets, device sessions, push subscriptions,
  notifications, guardian links and registration drafts are deleted outright;
  memberships move to `FORMER`. Logged as `ACCOUNT_DELETED`. The last active
  administrator is blocked (`canDeleteOwnAccount`) so the club can't be
  orphaned.

Session revocation on deletion is automatic — `anonymiseAccount` deletes the
`AuthSession` rows, so the JWT stops resolving on the next request regardless of
the client also calling `signOut()`.

## Waiting on the club (Doc 6 §19.6)

- **Retention periods** for the anonymised shell of a former player/staff
  member, and whether any of it should eventually be hard-deleted.
- Confirmation that anonymise-not-delete satisfies the club's obligations.
