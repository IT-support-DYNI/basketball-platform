# Phase 1 checkpoint

> Manager-facing summary: <https://claude.ai/code/artifact/17602f9c-7386-4744-a4af-5931c36d9336>

**Milestone (build plan, end W8): a real club can run on this.**
Register → get approved → see the schedule → RSVP → check in → get
announcements → message the team. Deployed, seeded, tested, accessibility-passed.

Built **on** `basketball-platform` (not the `dyni-blazers` monorepo), branch
`dyni-blazers`, 31 commits over 8 weeks, on the free tier throughout.

## The critical journey — all five legs covered by E2E

| Leg | Where |
| --- | --- |
| Register (multi-step, resumable) → admin approves → consent gate → in | `e2e/01-registration` |
| Open the schedule, RSVP to a match | `e2e/02-schedule-rsvp` |
| Check in to a session (venue PIN / rotating QR) | `e2e/03-check-in` |
| Read announcements, acknowledge the required one | `e2e/04-announcement-ack` |
| Post to the team channel | `e2e/05-team-message` |

## Scope — brief Phase 1 items vs. what shipped

| # | Brief area | Status | Notes |
| --- | --- | --- | --- |
| 1 | Identity, auth, sessions, MFA (§4, §11, §32) | **Done** | Email/password, verification, reset, brute-force lockout, admin TOTP MFA, revocable device sessions. Frontend included (was backend-only in the monorepo). |
| 2 | Roles & permissions / policy engine (§4) | **Done** | `@casl/ability` engine, additive scoped roles, 24-case test matrix, two-layer enforcement (middleware + every route). |
| 3 | Club / team / squad / season model (§5) | **Done** | Season-scoped `TeamMembership` with the race-safe unique-jersey constraint; staff assignments; archived + active season; CSV roster export. |
| 4 | Registration & onboarding (§6) | **Done** | 5-step resumable draft (server-saved), guardian branch for minors, admin approval queue (approve / reject-with-reason / request-changes). |
| 5 | Player profiles + field-level visibility (§7) | **Done** | Server-side visibility engine — medical / welfare / contact fields stripped per viewer before any response leaves the API. |
| 6 | Teams / rosters / jersey constraints (§8) | **Done** | See #3. Admin + coach roster management UI. |
| 7 | Role dashboards (§9) | **Done** | Player / coach / admin, each with a "needs your attention" band (unacked announcements, unread messages, pending RSVPs, pending registrations). |
| 8 | Calendar & events (§10) | **Done** | Event types, venues + map link, recurrence, month / week / agenda views, personal ICS feed. |
| 9 | Attendance, RSVP, QR/PIN check-in (§11) | **Done** | RSVP (intent) kept separate from attendance (fact); rotating-QR + venue-PIN self check-in; coach verification; corrections with full audit history; CSV reports. |
| 10 | Notifications (§12) | **Done** | Per-category channel preferences, de-duplication, a daily digest window. In-app always; email pluggable; web-push. |
| 11 | Messaging + safeguarding rules (§13) | **Done** (polling) | Team / group / direct conversations. Minor conversations auto-include a guardian; adult↔minor 1:1 DMs blocked. Transport is polling behind a single publish point — a realtime service drops in later. |
| 22 | Documents & consent — Phase 1 basics (§24) | **Done** | Versioned consent documents; append-only acceptance records; a blocking gate before full access. Full lifecycle (expiry, e-sign, renewal) is Phase 2. |
| 23 | Guardian relationships (§25) | **Done** | Guardian accounts manage linked children; per-child consent + status on the guardian dashboard. |
| 29 | Audit logging (§31) | **Done** | General-purpose `AuditLog` across registration decisions, roster exports, account security events, data export/deletion; admin viewer with filters. |
| 31 | Privacy — field visibility + data rights (§32–33) | **Done** | See #5. Self-service data export + account closure (anonymise, not hard-delete). |
| 32 | Accessibility (§34) | **Done** | Axe (WCAG 2.1 A/AA) over the UI primitives and 11 full pages across every role — zero violations. Both themes. |
| 35 | Versioned REST API (§37) | **Done** | 91 `/api/v1` routes, shared Zod contracts, consistent error envelope + request IDs, generated OpenAPI. |
| 36–37 | UI structure + essential screens (§38–39) | **Done for Phase 1** | 50 pages; responsive shell, one nav model at every breakpoint. |
| 38 | Testing (§40) | **Done** | 127 unit / component / a11y tests (no DB) + 6 Playwright E2E specs against a seeded build. Both run in CI. |
| 39 | Seed data (§41) | **Done** | Deterministic, realistic club: 2 teams, staff in every safeguarding role, 14 players + guardians, a term of training + matches with attendance, RSVPs, evaluations, chat, announcements, audit trail. |
| 40 | Monorepo / DevOps (§2–3) | **Adapted** | Single Next.js app on Vercel Hobby + Neon rather than the Turborepo. API-first + shared contracts + PWA keep a future React Native app viable. |

## Explicitly deferred (Phase 2+, per Doc 6 §19)

- Realtime chat transport (hosted service) — polling for now.
- Full document lifecycle: expiry, renewal reminders, e-signature.
- Membership plans, invoices, payments.
- Training plans, development plans, match-day mode, statistics, video.
- Public club website; global search; printable reports.
- AI features (Phase 4 — gated behind production data).

## Quality bar at checkpoint

- `npm run test:run` — 127 pass, no database.
- `npm run e2e` — 6 specs, 5 journeys + the accessibility sweep, against a real build.
- CI: lint, typecheck, DB-less build (`check` job) + Postgres-backed E2E (`e2e` job).
- Security headers (CSP, HSTS, …); IDOR sweep documented; login rate-limited.
- `docs/`: API, AUTHZ, ORGANISATION, SCHEDULING, FIELD-VISIBILITY, GUARDIANS,
  REGISTRATION, COMMUNICATION, SECURITY, TESTING, DEPLOYMENT, RUNBOOK.

## Open questions for the club (needed before Phase 2 steps)

- Data-retention periods for former members; is anonymise-not-delete acceptable?
- Confirmed payment provider (blocks the payments step).
- Real transactional-email provider (or stay on console/log for now?).
- Final consent-document wording and versions.
- Is the "second authorised adult" messaging rule on for this club? (Default: off, DM restriction on.)
