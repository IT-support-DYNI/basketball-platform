# Training

Session plans and a reusable drill library (brief §14). Phase 2, W9–10.

## Drill library (W9 part 1)

Migration `20260903120000_training_drills`. `Drill` — `clubId` (null = a
shared/global drill every club sees), `name`, `category` (`DrillCategory`),
`difficulty` (`DrillDifficulty`), `summary`, `instructions`, `coachingPoints[]`,
`commonMistakes[]`, `durationMinutes`, `min`/`maxPlayers`, `equipment[]`,
`courtDiagram` (jsonb — annotations, wired in a later part), `tags[]`,
`createdByUserId`, `archivedAt` (soft-hide from pickers).

- **One library per club.** Every coach on the club reads the whole thing and
  can add or edit any drill in it — it's a shared bank, not per-coach. Only the
  drill's author (or an admin) can *delete*; anyone else archives.
- **authz** — subject `"Drill"`. `HEAD_COACH` / `ASSISTANT_COACH` get
  `read` / `create` / `update`, plus `delete` scoped to `createdByUserId`.
  `TEAM_MANAGER` gets `read`. `CLUB_ADMIN` manages all. Players / guardians have
  no access — it's a coaching tool.
- **API** — `GET /api/v1/drills` (`?category=&difficulty=&q=&tag=&archived=1`),
  `POST /api/v1/drills`, `GET|PATCH|DELETE /api/v1/drills/{id}`. `lib/drills.ts`
  (`listDrills`, `drillById`) scopes every query to the caller's club + the
  shared set. Contracts in `lib/contracts/training.ts`; client-safe labels in
  `lib/training.ts`.
- **UI** — `/coach/drills` (`DrillLibrary`: search + category / difficulty
  filter chips, grouped by category), `/coach/drills/new` and
  `/coach/drills/{id}` (`DrillDetail`: read view + inline edit + archive /
  delete). Nav capability `coach.drills`.
- **Seed** — 7 drills across warm-up, ball-handling, shooting, defense,
  transition, scrimmage and cool-down.

## Session plans (W9 part 2)

Migration `20260903130000_training_plans`. `TrainingPlan` — `teamId` +
`seasonId` (+ optional `squadId`), `title`, `objectives`, `date` (null for
templates), `status` (`DRAFT` / `PUBLISHED` / `COMPLETED`), `isTemplate`,
`coachingNotes`, `eventId` (`@unique` — the scheduled session it belongs to,
wired in part 3), `effectivenessRating` + `postSessionNotes` (post-session),
`templateOfId` (self-FK — "started from this template"), `createdByUserId`.
`TrainingBlock` — `trainingPlanId`, `category` (`TrainingBlockCategory`:
WARMUP / SKILL / TACTICAL / CONDITIONING / SCRIMMAGE / COOLDOWN / OTHER),
`order`, `title`, `durationMinutes`, `notes`, `drillId` (optional library
reference).

- **authz** — subject `"TrainingPlan"`. `HEAD_COACH` / `ASSISTANT_COACH`:
  full CRUD scoped to `{ teamId }`. `TEAM_MANAGER`: read. `PLAYER`: read
  `{ teamId, status: "PUBLISHED" }` only. `CLUB_ADMIN`: manage all.
- **API** — `GET /api/v1/training-plans` (`?status=&templates=1`; players get
  only PUBLISHED), `POST` (optionally `fromTemplateId` — copies its blocks),
  `GET|PATCH|DELETE /api/v1/training-plans/{id}`. **`PATCH` replaces the whole
  block list** in order (delete-all + `createMany`), the same pattern consent
  versions / evaluation category scores use. `lib/training-plans.ts` owns the
  authz checks; `planDurationMinutes` (in `lib/training.ts`) sums block times.
- **UI** — `/coach/training/plans` (grouped: upcoming/drafts, templates, past),
  `/coach/training/plans/new` (`NewPlanForm` — title, objectives, date or
  "save as template", optional start-from-template), `/coach/training/plans/{id}`
  (`PlanBuilder` — inline header edit, block cards with category / title /
  duration / notes / drill picker / reorder, running total, publish → complete
  → post-session rating). Nav capability `coach.plans`.
- **Seed** — a published U16 plan (6 blocks referencing the seeded drills) and
  a reusable senior template.

## Attach to a session + player view (W9 part 3)

No migration — uses the existing `TrainingPlan.eventId @unique`.

- **Link / unlink** — `createTrainingPlanSchema` + `updateTrainingPlanSchema`
  take `eventId` (number to link, `null` to unlink). `lib/training-plans.ts`
  `resolveEventLink` validates it: the event is on the plan's team, isn't a
  deadline type, and isn't already taken by another plan (→ `409`). Linking
  also fills the plan's `date` from the event when it's blank. Templates can't
  be linked. `linkableSessionsFor(teamId, currentPlanId?)` lists the team's
  recent + upcoming training / matches that are free (or already this plan's).
- **Where it's set** — the `PlanBuilder` header has a "Linked session" select.
  The calendar event dialog (`components/calendar/CalendarView.tsx`), for a
  coach on a plannable team event, shows the linked plan (a link) or a
  "Build a session plan →" link to `/coach/training/plans/new?eventId=…`, which
  pre-fills the team + date and links on create.
- **Player read view** — `components/training/PlanReadView.tsx` renders a plan
  read-only (objectives, blocks with durations + drill names, running total).
  The calendar dialog embeds it for a player when the event's plan is
  `PUBLISHED` — it fetches `/api/v1/training-plans/{id}` (players are authorised
  for their team's published plans only). The event list + detail API now carry
  `trainingPlan { id, title, status }`.

## Still to come

- Part 4 — the `CourtDiagram` editor for drills (SVG half-court, players /
  cones / movement arrows serialised to `courtDiagram` jsonb).
