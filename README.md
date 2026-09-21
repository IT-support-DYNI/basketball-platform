# DYNI Blazers Platform

The club management platform behind **[DYNI Blazers](https://dyniblazers.co.uk)** — a community basketball club run by Diverse Youth Northern Ireland, Belfast. One place for registration, team rosters, training, attendance, player development, safeguarding, and the club's public website.

## What it does

- **Public site** — the club's story, roster, coaches, and safeguarding information for anyone to browse, plus a registration and safeguarding-concern form.
- **Registration & membership** — guardian-managed accounts for junior players, admin-reviewed registration, and a full consent system (code of conduct, media, medical, data protection, terms of service) that every member accepts and can review at any time.
- **Teams & scheduling** — rosters, squads, a shared calendar for training and matches, RSVPs, and QR/PIN check-in on the day.
- **Player development** — coach evaluations, written feedback, training plans, drill libraries, and a video library coaches can assign to a team or an individual player.
- **Safeguarding** — a public concern form that goes straight to the club's admin team (anonymously if preferred), role-limited access to sensitive information, and an audit trail of who reviewed what.
- **Communication** — team and direct messaging, announcements, and notifications, with rules that keep staff-to-junior contact appropriate by design.

## Built with

Next.js (App Router) + TypeScript + Tailwind CSS, Prisma + PostgreSQL, NextAuth for authentication, and S3-compatible object storage for photos and video.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design, data model, and API structure
- [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) — local setup, environment configuration, and deploying a new instance
- [docs/EDITING-THE-SITE.md](./docs/EDITING-THE-SITE.md) — a plain-English guide to changing site content, without touching code
- [SECURITY.md](./SECURITY.md) — our security policy and how to report a vulnerability

## Ownership

This platform is built and maintained for Diverse Youth Northern Ireland. It isn't open for public contributions; see [SECURITY.md](./SECURITY.md) if you've found a security issue, or get in touch with the club directly for anything else.
