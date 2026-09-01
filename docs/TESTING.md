# Testing

Two layers, both run in CI (`.github/workflows/ci.yml`).

## Unit + component (Vitest)

`npm run test:run` — jsdom, `@testing-library/react`, `jest-axe`. **No database.**
Everything under `{app,components,lib}/**/*.test.{ts,tsx}`. Pure logic
(`lib/*.test.ts` — attendance %, recurrence, RSVP windows, login throttle,
field visibility, safeguarding DM rules, account anonymisation, audit labels,
nav) plus an accessibility sweep of the UI primitives
(`components/ui/ui.a11y.test.tsx`).

Rule: a unit test must not import anything that opens a DB connection at call
time. Importing a module that *constructs* `PrismaClient` is fine (it connects
lazily); calling a function that queries is not.

## End-to-end (Playwright)

`npm run e2e` — Chromium against a real `next build` + `next start`, driving a
**seeded** database. `prisma/seed.ts` is deterministic and destructive, so every
run starts from identical fixtures.

`e2e/` covers the five Phase 1 critical journeys:

| Spec | Journey |
| --- | --- |
| `01-registration` | Applicant completes the multi-step form → admin approves → applicant clears the consent gate → reaches the dashboard |
| `02-schedule-rsvp` | Player opens the schedule, finds an upcoming match, RSVPs, reload confirms it stuck |
| `03-check-in` | Player checks in to a live session with the venue PIN |
| `04-announcement-ack` | Member reads the announcements and acknowledges the required one |
| `05-team-message` | Player opens their team channel and posts a message |

`e2e/support/helpers.ts` has `login` / `logout` and a shared `PrismaClient` used
for setup and for standing in where a real user would act out of band (clicking
an email-verification link → `verifyEmail`).

Specs run **serially, one worker** — they share the one seeded database and some
mutate it. Local runs reuse a server already on :3000; CI always starts fresh.

## CI

- **`check` job** — lint, typecheck, `test:run`, `next build` (build uses a
  throwaway `DATABASE_URL`; it must never touch a real DB — see `SECURITY.md`
  and the `force-dynamic` note for DB-backed route handlers).
- **`e2e` job** — spins up a `postgres:16` service, `prisma migrate deploy`,
  `prisma db seed`, `next build`, `playwright test`. Uploads the HTML report on
  failure.
