# Basketball Team Platform

Team management and player development platform for basketball coaches and players. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system design, database schema, and API structure this scaffold implements.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS · Prisma + PostgreSQL · NextAuth (Auth.js) · Cloudflare R2 for video/photo storage. See ARCHITECTURE.md §1 for rationale.

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Database** — point `.env` at a local Postgres instance (copy `.env.example` to `.env` and fill in `DATABASE_URL`/`DIRECT_URL`; they can be identical locally). Then:

   ```bash
   npm run prisma:migrate
   ```

   This also runs the seed script automatically (see below) on the first migration.

3. **Auth secret** — generate one and set it in `.env`:

   ```bash
   openssl rand -base64 32
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

5. **Log in** with one of the seeded accounts (password `password123` for all):

   | Role | Email |
   |---|---|
   | Admin | admin@example.com |
   | Coach | coach@example.com |
   | Player | player1@example.com / player2@example.com |

   To re-run the seed manually: `npm run prisma:seed`.

## Video/photo storage (Cloudflare R2)

Video upload (`/coach/videos`) needs R2 credentials in `.env` (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`) — see `.env.example`. Without them, every other feature works; only video upload will show a clear "storage isn't configured" error.

## Icons

`public/icons/icon.svg` is a placeholder app icon — swap it for real PNG icons (192×192, 512×512, apple-touch-icon) before shipping to production; some platforms (notably older iOS Safari) don't accept SVG manifest icons.

## Account provisioning

There's no public sign-up. Admin creates Coach accounts (`/admin/users`); Admin or a Coach adds Players to a team roster (`/admin/teams/:id` or `/coach/my-teams/:id`). Each creation returns a one-time temporary password to relay to the new user manually — they're forced to set their own password on first login. See ARCHITECTURE.md §6.1 for why.

## Project structure

See ARCHITECTURE.md §5 for the intended folder structure and reasoning (single Next.js app, not a monorepo).
