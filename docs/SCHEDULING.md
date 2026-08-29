# Scheduling & events

W5. Replaces the old `TrainingSession` model with a general **`Event`** — training,
matches, meetings, deadlines — plus **`Venue`** and an `EventRecurrence` rule
(materialised occurrences land in W5 part 2).

## Model

| | |
|---|---|
| `Event` | `teamId?` (null = club-wide), `type` (`EventType`), `title`, `description`, `venueId?` / `locationText?`, `startAt` / `endAt` (proper datetimes — no more date + "HH:MM" strings), `arrivalTime?`, `rsvpDeadline?`, `capacity?`, `dressCode?`, `visibility` (`TEAM`/`CLUB`/`PUBLIC`), `status` (`SCHEDULED`/`COMPLETED`/`CANCELLED`/`POSTPONED`), `recurrenceId?`, `createdByUserId`. A deadline-style event has `startAt === endAt`. |
| `Venue` | club-scoped: `name`, `address`, `mapLat`/`mapLng`, `notes`, `checkInPin` (static fallback for W5 part 4 check-in). `ON DELETE SET NULL` onto `Event.venueId`. |
| `EventRecurrence` | RRULE-lite: `frequency` (`DAILY`/`WEEKLY`/`MONTHLY`), `interval`, `byWeekday[]`, `until?`, `count?`. Not yet wired to creation. |
| `AttendanceRecord` | now keyed on `eventId` (was `sessionId`); otherwise unchanged. |
| `Feedback.eventId` | renamed from `sessionId`. |

`Event.createdBy` is a **`User`** (not `CoachProfile`) so admins can own club-wide
events. Attendance is still recorded by a `CoachProfile` (`recordedByCoachId`).

## Migration `20260829090000_events_and_venues`

`TrainingSession` rows are carried over as `Event` rows **with the same id**, so
existing `AttendanceRecord` / `Feedback` FKs map straight across. `startAt` /
`endAt` are backfilled as `date_trunc('day', date) + startTime::time` (naive
club-local, stored without a zone — fine at single-club scale). `createdByCoachId`
→ `createdByUserId` via a `CoachProfile` join. `SessionStatus` → `EventStatus`
(+`POSTPONED`).

## API

| | |
|---|---|
| `GET /api/v1/events?from=&to=&teamId=&type=` | calendar feed, scoped to what the caller can see (own teams + club-wide; admins all) |
| `POST /api/v1/events` | create — coaches for their teams, admins also club-wide (`teamId: null`) |
| `GET/PATCH/DELETE /api/v1/events/{id}` | DELETE = set `CANCELLED`, never a hard delete (brief §14) |
| `GET/PUT /api/v1/events/{id}/attendance` | unchanged bulk-upsert contract |
| `GET /api/v1/venues`, `POST` (admin), `PATCH/DELETE /api/v1/venues/{id}` (admin) | venue CRUD; delete blocked while events reference it |

Old routes `/api/v1/teams/{id}/sessions` and `/api/v1/sessions/{id}*` are removed.

## Authz

`Event` and `Venue` subjects in `lib/authz/ability.ts`. Coaches: full rights on
their team's events + read club-wide + read venues. Players: read their team's
events + club-wide + venues. Admins: everything. `lib/events.ts#visibleEventScope`
is the matching Prisma `where` fragment for list queries.

## Recurrence (W5 part 2)

`POST /api/v1/events` accepts an optional `recurrence` (`frequency`,
`interval`, `byWeekday[]`, `until?` | `count?`). `lib/recurrence.ts#expandOccurrences`
materialises one `Event` row per occurrence in a transaction, all sharing the
`recurrenceId` — capped at `MAX_OCCURRENCES` (260) and a one-year horizon.
Editing a single occurrence just edits that row; `PATCH`/`DELETE
/api/v1/events/{id}?scope=series` applies to this occurrence **and every later
one** in the series (per-occurrence datetimes are never bulk-rewritten).

## Calendar UI (W5 part 2)

`components/calendar/CalendarView.tsx` — a client component with **month / week /
agenda** views, prev/next/today navigation, a type-coloured event chip, and a
details dialog (with a per-event `.ics` download + a "Manage" link for staff). It
fetches `/api/v1/events?from=&to=` on range change. Wired into the three
`/…/training` pages (now "Schedule"); coaches also get the create form there.

## ICS export (W5 part 2)

- `GET /api/v1/events/{id}/ics` — one event, `Content-Disposition: attachment`.
- `GET /api/v1/public/calendar.ics?token=…` — a personal subscription feed
  (public, no cookies; gated by an unguessable per-user token). Returns the
  caller's visible events for a window around now.
- `GET|POST /api/v1/calendar/token` — reveal / rotate the token; the URL is
  surfaced by the calendar's **Subscribe** button. Token lives in
  `User.calendarToken` (migration `20260829140000_calendar_token`).

`lib/ics.ts` builds RFC-5545 output (UTC times, CRLF, 75-octet line folding,
text escaping).

## Still to come

- **W5 part 3** — RSVP (`AvailabilityResponse`, deadline + capacity), reminders
- **W5 part 4** — QR check-in (`QrCheckInToken`), venue PIN, check-in/out times, `AttendanceAudit` corrections, reports
