# Deployment

Free tier throughout: **Vercel Hobby** (web) + **Neon** (Postgres). No paid
services in Phase 1.

## Environments

| Env | Host | Database |
| --- | --- | --- |
| Local dev | `npm run dev` | local Postgres (`postgresql://…@localhost:5432/basketball_platform`) |
| Preview (per PR) | Vercel preview deploy | a **Neon branch** off production |
| Production | Vercel production | Neon primary (pooled) |

## Environment variables

Set in the Vercel project (Settings → Environment Variables). `.env.example` is
the canonical list; the essentials:

| Variable | Scope | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Production + Preview | Neon **pooled** connection string. Preview points at a Neon branch, not prod. |
| `DIRECT_URL` | Production + Preview | Neon **direct** (unpooled) — used only by `prisma migrate deploy`. |
| `NEXTAUTH_SECRET` | Production (+ Preview) | `openssl rand -base64 32`. Different value per environment. |
| `NEXTAUTH_URL` | **Production only** | The canonical domain. On Preview, leave it **unset** — `lib/base-url.ts` / NextAuth derive it from `VERCEL_BRANCH_URL`, so each preview URL works. |
| `CRON_SECRET` | Production | Bearer token Vercel Cron sends to `/api/v1/cron/reminders`. Unset elsewhere = the job runs unguarded (fine for local). |
| `MAIL_TRANSPORT` | all | `console` for now (logs the link). Swap to a real adapter in `lib/mail/index.ts` when a provider is chosen. |
| `VAPID_*` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Production | `npx web-push generate-vapid-keys` once. Public key must be duplicated into the `NEXT_PUBLIC_` var. Push is skipped cleanly if unset. |
| `STORAGE_*` / `R2_*` | — | Object storage for video/photos. Not used in Phase 1; endpoints error clearly if called without it. |

## How a deploy works

`package.json` → `"build": "prisma migrate deploy && next build"`.

1. Push to `dyni-blazers` (or merge to `master`) → Vercel builds.
2. **`prisma migrate deploy`** applies any pending migrations to the target
   database as the first build step — migrations ship as SQL in
   `prisma/migrations/` and are never run ad hoc.
3. `next build` compiles. A failing migration fails the deploy before the new
   build goes live.
4. Vercel promotes the new deployment; the old one stays available for instant
   rollback.

CI (`.github/workflows/ci.yml`) gates every push first: lint, typecheck, unit
tests, a DB-less `next build`, then the E2E suite against a throwaway Postgres.

## Cron

`vercel.json` registers one job: `/api/v1/cron/reminders` daily at 08:00 UTC
(RSVP nudges + the notification digest). It is only active on production
deploys. Guarded by `CRON_SECRET`.

## First-time production setup

1. Create the Neon project; copy the pooled + direct strings.
2. Create the Vercel project from the GitHub repo; set the env vars above.
3. First deploy runs `prisma migrate deploy` against an empty database — it
   creates the schema. **Do not run the seed against production** (`prisma/seed.ts`
   refuses when `NODE_ENV=production`, and it is destructive regardless).
4. Create the first admin account directly (a one-off `prisma studio` insert or
   a short script) — there is no public admin signup.
5. Enable Neon's "create branch for preview deployments" integration so PRs get
   an isolated database.

## Rollback

- **Bad build / regression:** Vercel dashboard → Deployments → the last good one
  → "Promote to Production". Instant; no rebuild.
- **Bad migration:** migrations are forward-only. If a deploy applied a
  destructive migration, restore from a Neon point-in-time branch (Neon keeps a
  history window) and ship a corrective migration. Test the migration on a
  preview branch first — this is why `DIRECT_URL` points at a branch there.
