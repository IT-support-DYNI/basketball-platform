# Incident runbook

First moves for the incidents most likely in Phase 1. Scope: one club, free
tier (Vercel Hobby + Neon), one maintainer. See `DEPLOYMENT.md` for the deploy
model and `SECURITY.md` for the security posture.

## Triage order

1. Is it **down** (5xx / blank) or **degraded** (slow / one feature broken)?
2. **When did it start** — does it line up with the last deploy? (Vercel →
   Deployments shows times.)
3. If it lines up with a deploy → **roll back first, diagnose after**
   (Vercel → promote the previous deployment; instant, no rebuild).

## Site is down

| Check | Where | Fix |
| --- | --- | --- |
| Recent deploy? | Vercel → Deployments | Promote the last good one. |
| Build failing? | Vercel build logs | Usually a failed `prisma migrate deploy` — see "Migration failed". |
| Database unreachable? | Neon dashboard status; app logs show `P1001` / connection errors | Neon free tier **auto-suspends on idle** and takes a few seconds to wake — a first request after quiet time can time out, then recover. If it stays down, check Neon status page. |
| Env var missing/rotated? | Vercel → Environment Variables | A missing `DATABASE_URL` / `NEXTAUTH_SECRET` 500s everything. Restore and redeploy. |

## Migration failed during deploy

The deploy stops at `prisma migrate deploy`, production stays on the old build.

1. Read the error in the Vercel build log.
2. Reproduce on a **preview branch** (its `DIRECT_URL` points at a Neon branch,
   not prod).
3. Fix the migration SQL, push, let the preview deploy apply it cleanly, then
   merge.
4. Never edit a migration that has already applied to production — add a new
   corrective one.

## Cron not running (RSVP nudges / digest stopped)

- Cron only runs on **production** deploys, not preview.
- Check Vercel → Cron Jobs for the last run + status.
- A 401 there means `CRON_SECRET` in the env doesn't match — Vercel sends the
  project's value automatically, so this only happens if the var was changed.
  Realign and redeploy.
- Manual trigger to verify: `curl -H "Authorization: Bearer $CRON_SECRET"
  https://<prod>/api/v1/cron/reminders` — it's idempotent (per-event
  `rsvpReminderSentAt`, per-day digest window).

## Leaked secret

1. Rotate it immediately at the source (Neon → reset password; `openssl rand`
   for `NEXTAUTH_SECRET`; `npx web-push generate-vapid-keys`; new random
   `CRON_SECRET`).
2. Update the Vercel env var, redeploy.
3. Rotating `NEXTAUTH_SECRET` invalidates every session — everyone signs in
   again. That's the intended blast radius.
4. If `DATABASE_URL` leaked: rotate the Neon credential; review Neon's
   connection logs for unfamiliar clients.
5. Purge the secret from git history if it was committed (`git filter-repo`),
   force-push, and tell anyone with a clone.

## "Please delete my data" / data request

- **Self-service first**: point them to Settings → Your data (`/settings/account`)
  for export and account closure. See `SECURITY.md` for exactly what closure
  scrubs vs. keeps (anonymised).
- A guardian's request covers their linked children.
- An admin-initiated erasure (person can't sign in) has no UI yet — run
  `lib/account.ts#anonymiseAccount(userId)` from a short script. Log why.

## Security report from a member of the public

1. Acknowledge, don't argue. Get reproduction steps.
2. If it's active exploitation (data exposure, auth bypass): take the affected
   surface offline if you can isolate it, or roll back to a version without it.
3. Fix on a branch, verify with a test that would have caught it, ship.
4. If personal data was accessed, note it — the club may have a notification
   obligation (a question for the club, in `SECURITY.md`'s "waiting on the club").

## Someone bricked their session by re-seeding

Local dev only. `prisma/seed.ts` is destructive and re-numbers every row, so a
stale JWT points at a `teamId` / `playerId` that no longer exists (blank
dashboards). Fix: sign out and back in.
