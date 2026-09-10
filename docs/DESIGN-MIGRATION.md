# DYNI Blazers design migration

Tracks the move from the original light "Hoops Platform" styling to the
DYNI Blazers dark-first design system. Started W1 of the delivery plan.

## The system

- **Tokens** — `app/globals.css` (CSS custom properties, RGB channel triplets so
  Tailwind opacity modifiers work) mirrored in `lib/design/tokens.ts` for JS
  consumers. Dark is the default; light + explicit `[data-theme]` overrides.
- **Tailwind** — `tailwind.config.ts` maps every colour utility to a token, so
  utilities are theme-aware with no `dark:` variants.
- **Fonts** — Archivo (display), Inter (body), Barlow Condensed (data/numerals),
  IBM Plex Mono (labels), wired in `app/layout.tsx`.
- **Primitives** — `components/ui/` (Button, TextField, Select, Alert, Card,
  PageHeader) and `components/theme/` (ThemeScript, ThemeToggle).
- **Brand** — `components/Brandmark.tsx`, assets in `public/brand/` +
  `public/icons/`.

## Transitional shims (remove when migration completes)

- `tailwind.config.ts` remaps the `slate` and `court` colour scales onto DYNI
  tokens so un-migrated screens stay legible in both themes.
- A bulk edit replaced `bg-white` → `bg-surface` and `bg-slate-800/900` →
  `bg-flame` across the codebase.
- Pastel tint utilities (`bg-emerald-50`, `bg-rose-50`, `bg-amber-50`, …) are
  still literal light colours — visually loud on dark. ~14 usages, all in
  status chips inside forms. Fixed per-screen during each module's rebuild.

## Screen status

| Area | Status | Notes |
|---|---|---|
| App shell (`NavBar`, layout, theme) | ✅ done | `components/nav/PrimaryNav.tsx` — same destinations everywhere, placed per breakpoint. `lg+`: one sticky **top** bar (brand · ≤4 primary pills via `primaryNavFor` · "More" · player bell). `<lg`: slim top bar (brand + bell) + a fixed **bottom** bar with the same tabs + "More". "More" opens a shared bottom-anchored drawer (full menu + identity + theme + sign-out). `AppContainer` is the shared page frame (fluid gutters; extra bottom room on mobile for the bar). |
| Auth: login, register, set-password, registration-status | ✅ done | Register flow is restyled only — the multi-step resumable rebuild is W5 |
| Player dashboard | ✅ done | reference implementation |
| Coach dashboard | ✅ done | |
| Admin dashboard | ✅ done | |
| `StatTile`, `StatusBadge` | ✅ done | theme-aware; legacy `accent` names kept as aliases |
| All other player screens | ⏳ shimmed | legible via token remap; full pass during each module's rebuild week. Legacy `<table>`s wrapped in `overflow-x-auto` + `min-w-*` so they scroll rather than crush on mobile. |
| All other coach screens | ⏳ shimmed | as above |
| All other admin screens | ⏳ shimmed | as above |
| Form components (`components/admin/*`, `components/coach/*`, …) | ⏳ shimmed | replaced with `components/ui` primitives as their screens are rebuilt |
| Radix primitive layer | ✅ done | `components/ui`: Button, TextField, Select, Checkbox, RadioGroup, Field (FieldError/FieldHint/ErrorSummary), Card, Badge, Alert, PageHeader, Skeleton/LoadingState/EmptyState/ErrorState/PermissionDenied, Dialog, Tabs, DropdownMenu, Tooltip, Toast (+ `useToast`), DataTable |
| `axe-core` in CI | ✅ done | `components/ui/ui.a11y.test.tsx` (Vitest + jest-axe), run by `.github/workflows/ci.yml` alongside lint + typecheck + build |
| Per-permission declarative nav menu | ✅ done | `lib/navigation.ts` — capability-keyed, merges + de-dupes for multi-role users; `NavBar` + `NavLinks` (active-state highlighting) consume it |

## W1 complete

Foundation, brand, primitives, nav and CI are in place. Remaining migration is
per-screen and happens during each module's rebuild week (W3 onward).

## §4 — Profile pages get bolder (7 Sept 2026 revision)

Manager feedback, relayed after a meeting: the platform reads as too flat —
more animation, more colour, more visual energy, and player profiles
specifically should look like an NBA.com player page (photo, team-colour hero,
a real stat strip), not a settings form.

This is a **deliberate, scoped revision** of the "one accent, calm, premium,
not hype" direction in the manager's build plan (Doc: *DYNI Blazers Build Plan*
§16) — not drift. Scope, agreed before building:

- **Player profile pages only.** Coach/admin dashboards, forms, tables and the
  rest of the app keep the existing restrained system. Nothing here is a
  license to add motion or colour elsewhere without the same conversation.
- **No new palette.** The brand already had `--flame` / `--ember` / `--gold`
  as a warm gradient family, just used sparingly (one flat accent colour at a
  time). The profile hero is the first place that family gets used *together*,
  as a gradient — still the club's own three colours, just turned up.
- **Motion is real but bounded.** A one-time rise-in on the hero, a pop on the
  avatar, and a count-up on the headline stats — every one of them entirely
  disabled under `prefers-reduced-motion` (see `app/globals.css`), not just
  shortened. No looping/ambient animation, no motion on scroll.
- **New profile facts**: height, weight, country (`PlayerProfile.weightKg`,
  migration `20260907131835_add_player_weight`; `nationality` already existed
  and is now labelled "Country" in the UI to match the brief). Same
  field-visibility tiers as `heightCm` — nothing new is public that wasn't
  already club-member-visible.
- **Built with real data only.** The stat strip shows attendance % and weekly
  form because those are real numbers the platform already computes — it does
  not show placeholder PPG/RPG/APG-style box-score stats, because those don't
  exist yet (that's Phase 2 W15–16). A fact the viewer isn't allowed to see is
  omitted, never shown blank.

Where it lives: `components/player/PlayerProfileHero.tsx` +
`components/player/CountUp.tsx`, fed by `lib/player-profile-view.ts` (which
wraps `resolvePlayerViewerScope` / `serializePlayerProfile` — no new
authorization surface). Wired into `/player/profile` (self) and the new
`/coach/players/[id]` (coach viewing a roster player).

## §5 — Dashboards get the same treatment (7–8 Sept 2026, further escalation)

Two follow-up rounds, both explicit: first "more colour, animations on
interaction, multiple scroll animations"; then a set of reference sites
(Thuze, Pracko, Paris Basketball, the SVGator animation catalogue) with the
instruction to push that energy into the dashboards too, not just profile
pages. **This explicitly supersedes two of §4's scope lines above** — "player
profile pages only" and "no new palette" no longer hold. Recorded here for the
same reason as §4: so this reads as a decision trail, not silent drift.

- **New palette, dark theme only** — `--ground`/`--surface`/`--flame`/
  `--success`/`--warning`/`--info` etc. all repainted to the exact hex values
  given (cooler, more saturated — `#FF6B35` flame, `#4ADE80` success, `#5B8CFF`
  info). Light theme and the logo-sampled `brand` swatch in
  `lib/design/tokens.ts` are untouched — nobody gave us light-mode hex codes.
- **A real sliding nav indicator** (`components/nav/PrimaryNav.tsx`) —
  measures the active item's actual DOM position and animates a shared
  gradient+glow pill to it, desktop top bar only; the mobile bottom tab bar
  still just changes icon/text colour.
- **Card hover everywhere** — every `StatTile` lifts, brightens its border and
  casts a glow in its *own* accent colour on hover (`components/StatTile.tsx`).
- **A dashboard hero per role** (`components/dashboard/DashboardHero.tsx`) —
  bold two-tone headline, a faint ghost-basketball watermark, and a
  `Marquee.tsx` fact ticker fed only real numbers (attendance, next session,
  pending registrations…) — never decorative copy. One hero per dashboard
  landing page, deliberately not added to list/settings pages: the brief's
  original worry about "hype" is still valid there, it just doesn't apply to
  the three "you land here first" screens.
- **Distinct identity per top-row stat**: Next Training (orange), Attendance
  (green, real animated progress bar), Weekly Form (blue, self-drawing
  sparkline from real monthly-trend data) — `components/dashboard/
  ProgressBar.tsx` / `Sparkline.tsx`, both pure CSS, no charting dependency.
- **Load-in stagger** on each dashboard's above-the-fold content
  (`.animate-stagger-rise`, staggered `animationDelay`) and `ScrollReveal`
  (IntersectionObserver, `components/player/ScrollReveal.tsx` — reused beyond
  its original profile-page purpose) on the sections below the fold.
- Everything above is still gated off entirely — not shortened — under
  `prefers-reduced-motion`.
- **Found and fixed in the process**: `StatTile`'s `sub` slot was a `<p>`,
  which broke the moment `ProgressBar`/`Sparkline` (both render a `<div>`) got
  passed into it — invalid HTML, and a real hydration error in the browser,
  not just a lint nag. Now a `<div>`.
- **Not done yet**: empty-state micro-animation, notification-bell
  pulse/badge, a sliding indicator on the mobile bottom tab bar. Flagged, not
  forgotten.

## Responsive shell (W4 follow-up)

The app now adapts down to a 375px phone: shell height went from a 426px
wrapping link stack to a ~53px top bar + ~56px bottom bar, no page has
horizontal bleed, and every table either reflows (`DataTable`) or scrolls inside
its own container. The same 4-primary + "More" destinations are used at every
breakpoint (`components/nav/PrimaryNav.tsx`); below `lg` they sit in a fixed
bottom bar, at `lg`+ they move into a single sticky **top** bar as pills next to
the brand. **Still to do** as each module is rebuilt: migrate the remaining raw
`<table>` pages onto the `DataTable` primitive (which collapses to stacked
cards) instead of horizontal scroll, and give `TeamManager`'s inline roster
editor a card layout on mobile.

## §6 — The public club site (8 Sept 2026, brief §28 brought forward)

A real request, not a mockup: unauthenticated marketing/showcase pages for
visitors — "what are we about," meet the players and coaches — in the
Thuze/Paris-Basketball/Pracko register (bold photo-style hero, live counters,
playful energy), explicitly *not* using the internal app's screens. The brief
already scoped this as its own surface (§28, "Public club website") for good
reason — it's building for a stranger with no account, which is a different
job than the dashboards §4/§5 are for.

- **Lives at `/club/*`**, a genuinely separate route tree with its own
  `PublicHeader`/`PublicFooter` (`components/public/`) — no `AppContainer`,
  no `PrimaryNav`. `NavBar` (root layout) suppresses itself there via a
  pathname header `middleware.ts` now stamps onto every request
  (`nextWithPathname`) — the only way a Server Component here can know its
  own route, short of restructuring the whole app into route groups.
- **No new data-access path.** `lib/public-site.ts` reads through the exact
  same `publicProfileApproved` flag and `PUBLIC_SCOPE` /
  `serializePlayerProfile` machinery the app already had for this — built,
  per an earlier round's design doc note, specifically so a guardian's
  opt-in gates what a stranger can see. Extended the identical
  `photoUrl`/`publicProfileApproved` pair onto `CoachProfile` (migration
  `20260908110801_add_coach_public_profile`) for parity — coaches didn't
  have any public-facing fields before this.
- **Not approved = doesn't exist.** A real player who isn't public-approved
  and a made-up player ID both 404 identically — there's no response
  difference an outside visitor could use to tell "private" from "no such
  player."
- **Demo content is real, not placeholder.** Two players and one coach are
  seeded with `publicProfileApproved: true` and an actual bio (one of the
  two is a minor — U16 — seeded as guardian-approved, matching the real
  workflow this represents) so the page has genuine content rather than an
  empty state on first load. Everyone else stays private by default.
- Reuses existing pieces rather than inventing a parallel design system:
  `CountUp`, `ScrollReveal`, the flame→ember hero gradient + ghost-basketball
  watermark motif from §5, and the global card-hover rule from §5 (any
  `rounded-card border border-line` on this site gets the same hover-lift
  for free).
- **Not done yet**: photo upload for coaches (players already have one —
  `components/player/PhotoUpload.tsx` — coaches don't yet, so coach cards are
  initials-only until that's built).

## §7 — Full public site build-out from manager mockups (9 Sept 2026)

The manager built two Claude-design mockups (`Blazers Club Site.dc.html`,
`Blazers App Dashboards.dc.html`) and asked for them adopted site-wide. This
pass covers the public site side; the dashboard mockup's "needs your
attention" alert-strip pattern (per-role real counts of unread messages,
unacknowledged announcements, unanswered RSVPs, pending registrations) is
real new data wiring, not styling, and hasn't been done yet — the existing
dashboards (§5) already match the mockup's hero/KPI-tile/marquee treatment.

- **New pages**: `/club/teams`, `/club/roster` (client-side filter chips by
  age group and position — `components/public/RosterGrid.tsx`), `/club/coaches`,
  `/club/about`. `PersonCard` extracted to `components/public/PersonCard.tsx`
  so home/roster/coaches share one implementation (and one place to not
  reintroduce the `display: inline` ghost-box bug from §6).
- **`PublicHeader` gained a mobile menu and a shrink-on-scroll treatment**
  (toggles `Brandmark`'s `sm`/`md` size) — the mobile-nav gap flagged in §6
  is closed.
- **Real data only — three things the mockups showed that this build
  deliberately left out**, because nothing in the schema backs them and
  showing them would be publishing an unverifiable or fabricated claim to
  an audience with no account:
  - No "DBS checked" coach badge. `getPublicCoaches`/`getPublicCoach` do
    show a real role line ("Head coach · Blazers U16") sourced from
    `StaffAssignment`, just not an unverifiable compliance claim.
  - No team "Trains: Tue/Thu" / "Spaces: OPEN/TRIAL/FULL" schedule table —
    `Team` has no capacity or training-day fields. `/club/teams` shows real
    member counts instead.
  - No News page with invented stories/dates. There's no news/CMS model in
    this app; `/club/news` is an honest empty state rather than the
    mockup's six fabricated posts with fake dates.
- `lib/public-site.ts` gained `POSITION_LABELS` (PG → "Point guard", etc —
  the DB's compact codes aren't visitor-friendly on their own) and per-coach
  `roleLine`.
- Found in the process, unrelated to this design pass but blocking: schema
  drift — `CoachProfile.photoUrl`/`publicProfileApproved`, `PlayerProfile.weightKg`,
  and the whole `PlayerHighlight` model were present in applied migrations
  and in code that queried them, but missing from `schema.prisma` itself
  (most likely an editor/git state that reverted the file without reverting
  the generated migrations). `npx tsc --noEmit` was failing project-wide
  before this was fixed by restoring the missing model fields to match the
  already-applied migrations.

## §8 — Public site replaced with the "DYNI Blazers Landing" Claude Design
   import (10 Sept 2026) — §6/§7 superseded

The manager built a proper design-system project in Claude Design
(`DYNI Blazers Design System`, imported via the `DesignSync` MCP tool after
running `/design-login`) and asked for its `DYNI Blazers Landing.html` page
adopted. This is a different, more considered visual language than §6/§7's
flame/ember dark theme — warm/editorial (`#F6DEC1` light ground, `#FE440B`
accent), italic Big Shoulders Display headings, IBM Plex Mono labels — and
it replaces §6/§7's public site entirely rather than sitting alongside it.

- **Where it lives**: `styles/dyni-landing/` (tokens + `landing.css`, ported
  from the export and scoped under a `.dyni-landing` wrapper class so its
  generic-named custom properties — `--bg`, `--accent`, `--text-1` — and
  element-level rules — `a`, `h1`–`h4`, `section` — can't leak onto the rest
  of the app; verified against every existing className first). Two renamed
  keyframes (`spin`→`dyni-spin`, `pulse`→`dyni-pulse`) avoid colliding with
  Tailwind's own `animate-spin`/`animate-pulse` globals.
- **Theme toggle reuses the app's existing mechanism** (`dyni-theme`
  localStorage key, `data-theme` on `<html>` — `components/theme/
  ThemeScript.tsx`) rather than inventing a parallel one; `ThemeToggleButton`
  just supplies this page's own `.toggle` markup over the same underlying
  state.
- **`app/club/layout.tsx` now renders the shared chrome for every /club/*
  page** — `LandingNav` (shrink-on-scroll, active-link highlighting via
  `usePathname`, and — added after verifying mobile broke without it — a
  hamburger + dropdown panel below 900px, since `.nav-links`/`.nav-act`
  together don't fit a phone width) and `LandingFooter`. The old
  Tailwind-styled `PublicHeader`/`PublicFooter`/`PersonCard`/`RosterGrid`
  (§6/§7) are deleted — every /club/* page uses one design now, not two
  stitched together.
- **Every /club/* page rebuilt in the new system**: `/club/roster` and
  `/club/coaches` show the *full* approved list (not just the home page's
  preview) — `/club/roster` keeps the age-group/position filter chips,
  restyled as `.chip`. `/club/players/[id]` and `/club/coaches/[id]` got a
  new `.profile-hero` treatment (dark band, jersey-ghost watermark, circular
  photo) instead of the old flame-gradient hero. `/club/moments` is new (the
  "All moments" full gallery); `/club/teams`, `/club/about`, `/club/news`
  restyled in place. New shared CSS added for things the export didn't have
  a sub-page version of: `.page-head`, `.chip`, `.card`, `.empty-state`,
  `.profile-hero`.
- **Content decisions carried over from §7, re-applied to the new markup**:
  no fabricated "DBS checked" badge, no invented team schedule/capacity
  table, no fabricated news stories. Two more of the export's own invented
  content got the same treatment this pass: a testimonial quote attributed
  to a named "parent" and a specific fabricated biography for a named coach
  in one hero slide — both dropped, not reworded, since a named individual's
  quote or life story isn't something to publish without it being real. The
  safeguarding section's "named lead" card also had a specific fabricated
  name attached to "the designated safeguarding lead, contactable directly"
  — replaced with a generic pointer to ask the club, since getting a
  safeguarding contact wrong is a safety issue, not just an accuracy one.
- **The trial-registration form** (`RegisterInterestForm`) doesn't fake a
  submission the way the export's did (`preventDefault()` + a local "we'll
  be in touch" message, no backend call at all) — collecting a guardian's
  email and child's name and pretending it was received would be a real
  trust problem on a safeguarding-conscious platform. It validates the same
  two fields, then sends the visitor into the real `/register` flow.
- **The hero carousel doesn't pause on hover** — the export's did
  (`mouseenter`/`mouseleave` cancel/resume of the autoplay `requestAnimationFrame`
  loop), but manager feedback after using it was that hovering anywhere over
  the hero (most of the viewport, reading a slide) made it look stuck.
  Removed outright rather than narrowed to a smaller hover target.
- **Real data wired in, not the export's six invented names**:
  `getClubStats()` gained a real `sessionsThisWeek` (scheduled `TRAINING`
  events in the next 7 days); `getPublicPlayers`/`getPublicPlayer` gained
  `publicStatus` — real `TeamMembership.status`, collapsed to `"Active"` /
  `"Trialist"` / `null` only, so INJURED/SUSPENDED/PENDING (real states, not
  ones to publish to a stranger) never reach a public card.
- **Not done yet**: the dashboard mockup's "needs your attention" pattern
  (§7's note still applies — real new data wiring, not styling).

## §9 — "Futuristic / high-end" visual pass over §8 (10 Sept 2026)

Manager feedback after using §8's warm/editorial version: liked the
structure and interactions, wanted the look pushed toward "futuristic,
high-end" — different type, cooler/darker palette, sharper data
presentation. This is a **skin change on top of §8's structure**, not a
rebuild: every class name, component, and page from §8 stays exactly as it
was: only `styles/dyni-landing/tokens/*.css` and a handful of targeted rules
in `landing.css` changed.

- **§8 preserved on request** ("keep this version in case I want to
  revert"): committed as its own checkpoint (`git log` — "Checkpoint: warm/
  editorial DYNI Blazers Landing design, full public site") before this pass
  started, *and* copied byte-for-byte to `styles/dyni-landing-v1-warm-
  archived/` (inert — nothing imports it) as a second, non-git way to see or
  restore it. To actually revert: `git revert` back to that commit, or swap
  the imports in `app/club/layout.tsx` to the archived folder.
- **Dark is now the default** (flipped from §8's light-default), matching
  the rest of the app's own already-stated convention ("Dark is the
  default" — app/globals.css) — the public site was the odd one out before.
  Palette is cooler/near-black (`#06070A`) rather than warm beige.
  **Accent stays the platform's own flame orange** (`#FF6B35`, the same
  value `app/globals.css` uses for `--flame`) rather than switching to a
  colder brand colour just because "futuristic" often reads that way —
  brand consistency with the dashboards mattered more here. A secondary
  `--accent-cyan` carries the "tech/data" register instead, used sparingly
  (just the live-status dot in the register section) rather than as a
  second primary colour.
- **Type**: Space Grotesk (upright, geometric) replaces the italic,
  condensed "broadcast" face (Big Shoulders Display) for headings — no more
  slant, no more forced uppercase on `h1`–`h4` (eyebrows/labels keep
  uppercase via their own `.eyebrow`/`.mono` classes, unaffected). JetBrains
  Mono replaces IBM Plex Mono for the same label/stat job. Fraunces (the
  pull-quote face) is gone along with the quote section itself.
- **Shape/elevation**: hover states across cards (`.team`, `.coach`, `.card`,
  `.safe-card`) now add an accent-tinted **glow** (`--shadow-glow-soft`,
  `--shadow-glow`) alongside their existing lift, instead of a plain dark
  drop-shadow — `.card`/`.safe-card` had no hover state at all before this
  pass. `.btn-primary` switched from a 2-colour diagonal gradient to a flat
  accent fill (reads more controlled/premium than a gradient). A faint
  (3.5% opacity) technical grid background was added across the whole page
  — cheap, and probably the single highest-leverage "futuristic" cue here.
- **Two real bugs found and fixed while verifying this pass, not present
  before it**:
  - The `.dyni-landing :where(a)`/`:where(button)` specificity fix from the
    "hard to see what's written on these orange buttons" report earlier
    still held, but is worth re-noting here since this pass touched the
    same rules again.
  - **Word-reveal spacing regression**: the hero headline's word-by-word
    reveal (`.w` spans) had no explicit space character between words in
    the JSX (`.map()` over an array with no separator) — invisible under
    the old all-caps, larger, more-likely-to-wrap type, but exposed the
    moment headings went upright/mixed-case and words started fitting on
    the same line ("Everyone developshere."). Fixed with a `Fragment` +
    literal space between word spans. A follow-up attempt at the same fix
    (wrapping each word in its own `<span>`) broke `.hero h1 .w:last-child`
    instead — that selector means "last among true DOM siblings", so
    giving each word its own wrapper made every `.w` the "last child" of
    its own wrapper, colouring the *entire* headline in the accent instead
    of just the final word. `Fragment` (no DOM element of its own) was the
    actual fix, verified via computed `color` per word after.
