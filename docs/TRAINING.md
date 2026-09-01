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

## Still to come

- Part 2 — `TrainingPlan` / `TrainingBlock`: ordered session sections
  (warm-up → skill → tactical → conditioning → scrimmage → cool-down), each
  referencing drills with durations and group notes; a duration roll-up.
- Part 3 — attach a plan to a scheduled `Event`; a player-facing read view;
  session templates + "duplicate session"; post-session notes + effectiveness
  rating.
- Part 4 — the `CourtDiagram` editor for drills (SVG half-court, players /
  cones / movement arrows serialised to `courtDiagram` jsonb).
