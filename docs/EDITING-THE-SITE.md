# Editing the site — where to go

A plain-English map for anyone who wants to change or add something on the DYNI Blazers site —
pictures, news, fonts, sizes, colors, or just page text. No coding background assumed; each entry
says exactly which file to open and what to look for.

There are two separate "sites" in this codebase, and they don't share styling:

- **The public site** — the marketing pages anyone can see without logging in: the homepage,
  players, coaches, roster, news, moments, safeguarding, about, etc. Every page's route starts
  with `/club` in the code (`app/club/...`) even though the actual web address is just `dyni-blazers.../club/...`.
- **The member app** — everything behind login: admin, coach, player and guardian dashboards.

Fonts, colors, and spacing are set up **separately for each one** (see below), so a change to one
doesn't affect the other unless you edit both.

---

## Quick index

| I want to...                                    | Go to |
|---------------------------------------------------|-------|
| Change the club crest / logo                       | [Logo & crest](#logo--crest) |
| Add or change a player/coach photo                  | [Player & coach photos](#player--coach-photos) |
| Change the homepage's big hero photo                | [Hero & other placeholder photos](#hero--other-placeholder-photos) |
| Add photos to the "Moments" gallery                 | [The Moments gallery](#the-moments-gallery) |
| Post a news update                                  | [News & updates](#news--updates) |
| Change the font (typeface)                          | [Fonts](#fonts) |
| Change text/heading sizes                           | [Sizes](#sizes) |
| Change the site's colors                            | [Colors](#colors) |
| Change wording/copy on a page                       | [Page text & copy](#page-text--copy) |
| Understand the folder structure generally           | `ARCHITECTURE.md` §5 (developer-level, more technical) |

---

## Pictures

### Logo & crest

The club crest/logo image files live in **`public/brand/`** — three sizes of the same crest PNG.
Replace the file(s) with a new image of the same name and dimensions and it updates everywhere
(nav bar, footer, favicon) automatically; nothing else needs to change.

### Player & coach photos

These are **real uploads**, not something you edit in code. A player's own photo is uploaded from
their profile page (`/player/profile`); a coach's or admin's staff photo works the same way from
their own profile. There's a working upload button right there — no file to find or edit.

### Hero & other placeholder photos

The homepage hero (the big box that currently says "PHOTO WILL BE INSERTED HERE") and a few other
spots like it **don't have a real photo yet** — they're honest placeholders, not a bug. To put a
real photo in:

1. Add your image file under `public/` (e.g. `public/hero-team.jpg`).
2. Open `app/club/_components/HeroCarousel.tsx`, find the `<div className="photo">` for the slide
   you want, and replace it with an `<img src="/hero-team.jpg" alt="..." />` (matching how photos
   are already done elsewhere on the site, e.g. player cards in `app/club/_components/RosterFilterGrid.tsx`).

This is a small code edit, not just dropping in a file — worth asking for help with if you're not
comfortable editing a `.tsx` file directly.

### The Moments gallery

`/club/moments` (`app/club/moments/page.tsx`) is currently a set of placeholder tiles with just
captions — there's no photo upload feature for it yet, only a hardcoded list at the top of that
file:

```
const MOMENTS = [
  { caption: "Match day" },
  { caption: "Training session" },
  ...
];
```

To add real photos here today, each entry needs an image file added under `public/` and a small
code change to show it (same pattern as the hero photo above). If the club wants to add moments
regularly, it's worth building a proper "upload a photo" admin page instead of hand-editing code
each time — ask and this can be built.

---

## News & updates

**Two different things share the word "news" here:**

- **`/club/news`** (the public page, `app/club/news/page.tsx`) is currently an honest empty state
  — "Nothing posted yet" — because there's no news system wired up for the public site yet. Adding
  a real post today means hand-editing that file directly with the story text.
- **Announcements** (`/announcements`, inside the member app) is a **real, working feature** —
  any admin can already post an update from `/admin/settings`, and it reaches every signed-in
  member (with a "please acknowledge" option for important ones). This is the right place for
  club updates *today*, even though it isn't shown to public visitors.

If the goal is "let the club post real news to the public website" as a repeatable thing (not a
one-off), that's worth building as its own small feature (an admin page to write a post, shown on
`/club/news`) rather than hand-editing code every time — ask and this can be built.

---

## Fonts

The site uses one display font (bold headlines) and one body font, loaded once per site and then
used everywhere via a couple of names.

**Public site** (`/club/*`):
- **Which fonts load** — `app/club/layout.tsx`, near the top. Four are loaded: Big Shoulders
  Display (headlines), Fraunces (the one italic pull-quote per page), IBM Plex Mono (labels/stats),
  Inter (body text).
- **Which one is used where, and at what size** — `app/club/_styles/tokens/typography.css`. Look
  for `--font-display`, `--font-body`, `--font-quote`, `--font-mono` — those four names are used
  throughout the site's other CSS files, so changing the font here changes it everywhere it's used.

**Member app** (admin/coach/player/guardian, everything behind login):
- **Which fonts load** — `app/layout.tsx`, near the top (same pattern as above: named font
  variables, currently Big Shoulders Display + Inter + IBM Plex Mono, matching the public site).
- **Which one is used where** — Tailwind's font names are set in `tailwind.config.ts` under
  `fontFamily` (`font-display`, `font-sans`, `font-condensed`, `font-mono` — these are the class
  names used all over the app's pages).

To swap a typeface: change the font import + loader call in the relevant `layout.tsx`, keeping the
same variable name (e.g. `--font-display`) so nothing else needs to change.

---

## Sizes

**Text/heading sizes:**
- Public site — `app/club/_styles/tokens/typography.css`, the `--type-*` values (`--type-hero`,
  `--type-display-1`, `--type-body`, etc.) — these are the sizes every heading and paragraph style
  uses.
- Member app — Tailwind's built-in size classes are used directly in each page (`text-sm`,
  `text-2xl`, etc.) rather than a central token file; find the class on the element you want to
  resize and change it there (e.g. `text-2xl` → `text-3xl` makes it bigger).

**Spacing (gaps, padding between sections):**
- Public site — `app/club/_styles/tokens/spacing.css` (`--space-1` through `--space-9`,
  `--section-y` for the gap between page sections).
- Member app — no central spacing file; Tailwind's spacing classes (`p-4`, `gap-6`, etc.) are used
  directly on each element, same as sizes above — find the class and change it.

**Corners/borders (how rounded things are):**
- Public site — `app/club/_styles/tokens/shape.css` (`--radius-xs` through `--radius-pill`; note
  the public site's whole look is deliberately flat and dashed-border, "spec sheet" style — not
  soft shadows).
- Member app — `app/globals.css` (`--radius-card`, `--radius-control`).

---

## Colors

- Public site — `app/club/_styles/tokens/colors.css`. The whole palette (background, ink/text,
  the one accent color, borders) lives here, with a light and dark version.
- Member app — `app/globals.css`, near the top (`--ground`, `--ink`, `--flame` — `--flame` is the
  orange accent color used for buttons and highlights everywhere).

Both use the same accent orange (`#FE440B`) by design — if you change one, consider changing the
other to match, or the two halves of the site will look like they belong to different clubs.

---

## Page text & copy

Most of the words on the public site (headlines, paragraph copy, button labels) are written
directly in each page's file under `app/club/` — e.g. the homepage is `app/club/page.tsx`, the
about page is `app/club/about/page.tsx`. Search the file for the sentence you want to change and
edit it in place; there's no separate content file to find.

---

## If something here is wrong or missing

This file describes the site as of the most recent redesign — if a file has moved or a feature
listed as "not built yet" has since been built, this doc is stale and should be corrected rather
than trusted blindly. For the fuller, more technical picture of how the codebase is laid out
(which folder holds which page's code, and why), see `ARCHITECTURE.md` §5.
