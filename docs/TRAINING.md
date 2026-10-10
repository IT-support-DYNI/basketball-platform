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
  The calendar event dialog (`components/shared/calendar/CalendarView.tsx`), for a
  coach on a plannable team event, shows the linked plan (a link) or a
  "Build a session plan →" link to `/coach/training/plans/new?eventId=…`, which
  pre-fills the team + date and links on create.
- **Player read view** — `components/shared/calendar/PlanReadView.tsx` renders a plan
  read-only (objectives, blocks with durations + drill names, running total).
  The calendar dialog embeds it for a player when the event's plan is
  `PUBLISHED` — it fetches `/api/v1/training-plans/{id}` (players are authorised
  for their team's published plans only). The event list + detail API now carry
  `trainingPlan { id, title, status }`.

## Court-diagram editor (W9 part 4)

No migration — fills the `Drill.courtDiagram` jsonb column.

- **Shape** — `courtDiagramSchema` in `lib/contracts/training.ts`:
  `{ markers: [{ id, kind, x, y, label? }], arrows: [{ id, kind, from, to }] }`.
  `kind` is `player` / `opponent` / `cone` / `ball` / `coach` for markers and
  `move` / `pass` / `dribble` / `screen` for arrows. **All coordinates are
  normalised 0–1** within a half-court box (basket at the top). The drill
  create/update schemas validate `courtDiagram` against this.
- **Component** — `app/coach/drills/_components/CourtDiagram.tsx` is both the editor and
  the read view (editor when passed `onChange`). It draws the half-court
  markings in SVG, then the arrows and markers. Editing: pick a tool, tap the
  court to drop a marker (drag to move it), or tap twice to draw an arrow;
  select + Delete/Backspace or the toolbar removes one; a selected player has a
  jersey-label input.
- **Accessibility** — the SVG carries `role="img"` and an `aria-label` from
  `describeDiagram()` ("Court diagram: 1 player, 1 defender, 1 movement
  arrow."), and the editor shows the same text hint. The freehand editing
  itself is pointer-only — a known limitation noted here rather than solved.
- **Wiring** — `DrillForm` has a "Court diagram" section; `DrillDetail` shows
  "Court setup" read-only when the drill has one (`diagramHasContent`). Seed:
  the "Closeout & mirror" drill ships with a diagram.

## W9 complete — training plans + drill library.

## Plays and the team playbook

A **play** is something the team needs to learn (offence, defence, inbounds,
press break, special situations): a name, a type, notes for players, and a court
diagram drawn with the same editor as drills.

- **Library:** `/coach/plays`. One shared library per club, like drills. Any
  coach can read every play, create plays, and make a copy of someone else's.
  Only the author (or an admin) edits or archives a play (`lib/authz/ability.ts`).
- **Assigning:** on a play's page a coach ticks the teams they coach;
  `PUT /api/v1/plays/:id/assignments { teamIds }` sets that set. Teams the caller
  doesn't coach are refused and other coaches' assignments are left alone
  (`lib/playbook.ts#planAssignmentChange`). Players and guardians on newly added
  teams get a `NEW_PLAY` notification (category "Team playbook", push on).
- **Playbook:** `/player/playbook` and `/guardian/playbook`. A player sees plays
  assigned to their current team; a guardian sees plays on any team their linked
  children are actively on (`lib/plays.ts#playbookTeamIds`). Anything else is a
  404. Archiving a play hides it from every playbook; restoring brings it back.
- **Data:** `Play` and `PlayAssignment` (migration `20261009120000_playbook`).

### Plays and drills inside session plans

A plan block can link **a drill or a play** from the library (one picker,
"From the library"; not both). The diagram a block shows is, in order:

1. the block's own diagram, if something is drawn on it;
2. otherwise the linked play's diagram;
3. otherwise the linked drill's diagram (`lib/training.ts#effectiveDiagram`).

So picking a drill or play brings its diagram with it; "Customise for this
session" copies it onto the block to change, and "Use the drill/play diagram
instead" drops the copy. Players see the same diagram in the calendar dialog and
on the plan page, plus the drill's or play's name; a play name links to their
playbook when the play is assigned to their team (`inTeamPlaybook`, computed per
plan so players never see which other teams have it). Block links are checked
against the club on save (`assertBlockLinks`). Creating a plan from a template
keeps each block's own diagram and its linked drill or play.

Not yet: multi-step animation, full court.

## Multi-step diagrams (plays)

Any court diagram (play, drill or plan block) can have up to 12 **steps**. The
first step is stored at the top level (`markers`, `arrows`, `caption`) and steps
2 onwards in `steps`, so every diagram saved before steps existed is still a
valid one-step diagram; no migration (`lib/contracts/training.ts`).

- **Editor:** step buttons 1, 2, 3; "+ Add step" copies the current step with
  everyone moved along that step's arrows (move/screen move the player,
  dribble moves player and ball, pass moves the ball;
  `lib/diagram-steps.ts#advanceAlongArrows`), so the coach only adjusts what's
  different. Each step has a short description.
- **Viewer:** previous/next and Play. Markers keep their id across steps, which
  is what the animation slides (`interpolateMarkers`); arrows show what happens
  next and hide while players move. With reduced motion it jumps between steps.
  Frames fall back to a timer if the browser pauses animation frames.

## Arrow types and curves

Seven arrow tools, in standard play-diagram notation (`ArrowShape` in the
diagram component): **movement** plain line, **cut** the same line in the
accent colour, **pass** dashed, **dribble** dotted, **screen** ends in a bar
across the line, **handoff** two ticks across its middle, **shot** a thin line
ending in a ring. Any arrow can bend: select it and use "Bend" (stored as
`curve`, -1 to 1; absent means straight, so older diagrams are unchanged).
Curves are quadratic Beziers (`lib/diagram-arrows.ts`). For "+ Add step", a cut
moves the player like movement does; handoff and shot move the ball like a pass.

## Starting sets (templates)

"Start from a set" above the diagram tools drops a whole formation onto the
current step (`lib/diagram-templates.ts`): offence 5 Out, 4 Out 1 In, Horns,
1-4 High, 1-4 Low, Box (players 1 to 5, ball with 1), and defence 2-3, 3-2 and
1-3-1 zones. An offence set replaces only the players and ball; a zone replaces
only the defenders; cones, the coach and arrows stay. So Horns then 2-3 Zone
gives an offence against a zone. The coach is asked before anything they placed
is replaced. Every marker gets a fresh id, so steps still animate correctly.
Perimeter spots are outside the drawn 3-point line; elbows sit on the corners of
the free-throw line.

## Half and full court

"Half court" / "Full court" in the diagram tools. A full court is vertical: the
usual half court on top, mirrored below, for press breaks, transition and
full-court drills. Stored as `court: "full"` on the diagram (absent means half,
so older diagrams are unchanged). Coordinates are 0 to 1 over whichever court is
shown; switching half to full moves everything into the top half (nothing lost),
and full to half keeps the top half and asks before removing anything in the far
half (`lib/diagram-court.ts`). Starting sets on a full court go in the top half.

