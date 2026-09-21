# Development & Setup Guide

Everything needed to run this platform locally or configure a new deployment. For how a deploy actually happens (environments, env vars, rollback), see [DEPLOYMENT.md](./DEPLOYMENT.md) — this doc covers configuring each optional feature.

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

4. **Set the bucket's CORS policy.** Uploads and playback go straight from the browser to the
   bucket via presigned URLs (never proxied through this app), so the bucket itself must allow
   your app's origin(s) to `PUT`/`GET` directly, or every upload fails with a CORS error that looks
   identical to a broken network connection. Both R2's and B2's dashboards (and the AWS CLI/SDK
   against either provider's S3-compatible API) take the same classic S3 shape:

   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.vercel.app"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   If the dashboard rejects it as invalid on the first attempt, that's been a transient glitch
   rather than a real schema issue in practice — retry as-is, or save a minimal version first
   (one origin, `AllowedMethods: ["GET"]`, nothing else) and build back up to the full policy
   above.

   `next.config.mjs`'s Content Security Policy also needs the storage host allowed — this is
   handled automatically as long as `STORAGE_ENDPOINT`/`R2_ACCOUNT_ID` is set in the environment the
   app builds with, no manual step needed there.

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

## Email (verification links, password resets)

Without a provider configured, `MAIL_TRANSPORT` defaults to `"console"` — every email (registration verification, forgot-password) just prints to the server log instead of sending. That's fine for local dev, but on a real deployment it means **nobody ever actually receives a password reset link**, they only exist in Vercel's function logs.

To send real email via **[Resend](https://resend.com)** (free tier, no card required):

1. Sign up, verify a sending domain under **Domains** (or use a subdomain you control — Resend walks you through the DNS records).
2. Create an API key under **API Keys**.
3. Set in `.env` (and Vercel → Settings → Environment Variables for production):

   | Key | Value |
   |---|---|
   | `MAIL_TRANSPORT` | `"resend"` |
   | `RESEND_API_KEY` | the API key from step 2 |
   | `MAIL_FROM` | e.g. `"DYNI Blazers <noreply@your-verified-domain.com>"` — must be on the domain verified in step 1 |

Until a domain is verified, Resend only delivers to the email address on the Resend account itself — sends to anyone else silently fail (logged server-side, per `sendMail`'s "never throws to the caller" rule in `lib/mail/index.ts`, but nothing reaches the user). Swapping providers later (SMTP, SES) is a one-file change — see `lib/mail/index.ts`.

Optionally set `SAFEGUARDING_CONTACT_EMAIL` to also send a direct email (a brief notice with a link into `/admin/safeguarding`, not the report content) to the club's safeguarding contact whenever someone submits a report — on top of, not instead of, the in-app admin notification. Leave it unset to rely on the in-app queue alone.

## Vercel-specific notes

On top of [DEPLOYMENT.md](./DEPLOYMENT.md)'s environment setup:

- `@vercel/analytics` and `@vercel/speed-insights` are already installed and rendered in `app/layout.tsx` (`<Analytics />` / `<SpeedInsights />`) — they no-op locally and activate automatically once deployed on Vercel.
- **You still have to flip two switches by hand** in the Vercel dashboard after the first deploy — this is a per-project toggle Vercel doesn't infer from the code: Project → **Analytics** tab → Enable, and Project → **Speed Insights** tab → Enable.
- `middleware.ts` explicitly excludes `/_vercel/*` from its auth check (see the comment on its `matcher`). That exclusion matters: both packages report by sending a beacon request to `/_vercel/insights/*` / `/_vercel/speed-insights/*` on your own domain, and without the exclusion the auth middleware would 307-redirect those beacons to `/login` and silently drop every event.

## Icons

`public/icons/icon.svg` is a placeholder app icon — swap it for real PNG icons (192×192, 512×512, apple-touch-icon) before shipping to production; some platforms (notably older iOS Safari) don't accept SVG manifest icons.

## Account provisioning

There's no public sign-up for staff accounts. Admin creates Coach accounts (`/admin/users`); Admin or a Coach adds Players to a team roster (`/admin/teams/:id` or `/coach/my-teams/:id`). Each creation returns a one-time temporary password to relay to the new user manually — they're forced to set their own password on first login. See ARCHITECTURE.md §6.1 for why. (Players and guardians can self-register publicly at `/register`; that registration is reviewed and approved by an admin before it grants access.)

## Project structure

See ARCHITECTURE.md §5 for the intended folder structure and reasoning (single Next.js app, not a monorepo).
