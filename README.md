# Basketball Team Platform

Team management and player development platform for basketball coaches and players. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system design, database schema, and API structure this scaffold implements.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS · Prisma + PostgreSQL · NextAuth (Auth.js) · S3-compatible object storage (Backblaze B2 or Cloudflare R2) for video/photo storage. See ARCHITECTURE.md §1 for rationale.

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

## Video/photo storage

Video upload (`/coach/videos`) needs object-storage credentials in `.env` — see `.env.example`. Without them, every other feature works; only video upload will show a clear "storage isn't configured" error.

**The bucket must be PRIVATE**, not public. Playback goes through short-lived signed URLs generated on demand (`lib/storage.ts`'s `getPlaybackUrl`) rather than a permanent public bucket link — nothing about a video's URL is ever stored. This is a deliberate choice, not just a security nicety: several providers' free tiers gate *public* bucket access behind a payment method or a one-time fee, while a private bucket has no such requirement anywhere.

Recommended: **[Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)** — 10GB free forever, S3-compatible, no card required at signup, private buckets are free.

1. Sign up, create a bucket (**Private**), then under **App Keys** create a key scoped to that bucket — gives you a Key ID and Application Key.
2. Note the bucket's S3-compatible endpoint shown on its page (e.g. `s3.us-west-004.backblazeb2.com`).
3. Set in `.env` (and Vercel → Settings → Environment Variables for production):

   | Key | Value |
   |---|---|
   | `STORAGE_ENDPOINT` | `https://` + the endpoint from step 2 |
   | `R2_ACCESS_KEY_ID` | the Key ID |
   | `R2_SECRET_ACCESS_KEY` | the Application Key |
   | `R2_BUCKET_NAME` | your bucket name |

   (Env var names keep the `R2_` prefix for historical reasons — they work identically for B2, R2, or any other S3-compatible provider; only `STORAGE_ENDPOINT` differs. If you use Cloudflare R2 instead, leave `STORAGE_ENDPOINT` blank and set `R2_ACCOUNT_ID` instead — the endpoint is derived from it automatically. R2 also requires a card on file even for its free tier, which is the whole reason B2 is the default recommendation here.)

## Push notifications (Web Push)

Players can opt in from `/player/notifications` to get browser push notifications for training changes, new videos, evaluations, feedback, and announcements — on top of the in-app notification list, which always works regardless of this. See `lib/push.ts` and `public/sw.js`.

1. Generate a VAPID keypair **once per deployment** (do this again for production — don't reuse the one already in this repo's local `.env`):
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Set four environment variables (locally in `.env`, and in Vercel → Settings → Environment Variables for production):

   | Key | Value |
   |---|---|
   | `VAPID_PUBLIC_KEY` | the generated public key |
   | `VAPID_PRIVATE_KEY` | the generated private key |
   | `VAPID_SUBJECT` | a contact URI, e.g. `mailto:you@example.com` |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | **same value as `VAPID_PUBLIC_KEY`** — this one is exposed to the browser bundle (the `NEXT_PUBLIC_` prefix is what does that), so the client can subscribe with the matching key. |

Without these set, the "Enable push notifications" button just tells the user push isn't configured yet — nothing else breaks. A subscription a browser has revoked (uninstalled the PWA, cleared site data) gets cleaned up automatically the next time a push to it fails.

## Deploying to Vercel

- `@vercel/analytics` and `@vercel/speed-insights` are already installed and rendered in `app/layout.tsx` (`<Analytics />` / `<SpeedInsights />`) — they no-op locally and activate automatically once deployed on Vercel.
- **You still have to flip two switches by hand** in the Vercel dashboard after the first deploy — this is a per-project toggle Vercel doesn't infer from the code: Project → **Analytics** tab → Enable, and Project → **Speed Insights** tab → Enable.
- `middleware.ts` explicitly excludes `/_vercel/*` from its auth check (see the comment on its `matcher`). That exclusion matters: both packages report by sending a beacon request to `/_vercel/insights/*` / `/_vercel/speed-insights/*` on your own domain, and without the exclusion the auth middleware would 307-redirect those beacons to `/login` and silently drop every event — the likely reason this didn't work on the previous project.
- Set `DATABASE_URL` / `DIRECT_URL` (pooled + direct connection strings, e.g. from Neon), `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (your production domain) as Vercel environment variables. `NEXTAUTH_URL` must match the exact domain you're serving from, or auth redirects (including logout) will point at the wrong host — see the note in ARCHITECTURE.md's deployment section.

## Icons

`public/icons/icon.svg` is a placeholder app icon — swap it for real PNG icons (192×192, 512×512, apple-touch-icon) before shipping to production; some platforms (notably older iOS Safari) don't accept SVG manifest icons.

## Account provisioning

There's no public sign-up. Admin creates Coach accounts (`/admin/users`); Admin or a Coach adds Players to a team roster (`/admin/teams/:id` or `/coach/my-teams/:id`). Each creation returns a one-time temporary password to relay to the new user manually — they're forced to set their own password on first login. See ARCHITECTURE.md §6.1 for why.

## Project structure

See ARCHITECTURE.md §5 for the intended folder structure and reasoning (single Next.js app, not a monorepo).
