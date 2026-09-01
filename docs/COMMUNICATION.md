# Communication

Three distinct surfaces: **announcements** (one-way broadcast), **notifications**
(per-user event feed), and **chat** (two-way).

## Announcements (W7 part 1)

Migration `20260901190000_announcement_ack`. `Announcement` gains `requiresAck`
and `pinnedUntil`; `AnnouncementAck` is one row per (announcement, user).

- **Reach** — `lib/announcements.ts#announcementAudience`: a TEAM announcement
  goes to the team's rostered players, their guardians, and the team's staff; a
  PLATFORM one to every active player / guardian / coach.
- **Surface** — `/announcements`, shared by every signed-in role (nav capability
  `announcements`; `/coach/announcements` now redirects here). Pinned items
  first, then newest. `announcementsFor(session)` attaches `acknowledgedByMe`
  and `canViewAcks`.
- **Acknowledge** — `POST /api/v1/announcements/{id}/ack` (idempotent). When
  `requiresAck` is set, readers see an "I've read this" button and non-readers
  get a "Please read:" notification.
- **Who hasn't** — `GET /api/v1/announcements/{id}/acks` (`ackBreakdown`) —
  author, the team's coach, or an admin only. Returns the expected audience with
  each person's ack state.
- `POST /api/v1/announcements` takes `requiresAck` + `pinnedUntil`; the compose
  form is in `components/announcements/AnnouncementsBoard.tsx` (a coach may pin
  and require ack; only an admin may post club-wide).

Acknowledgement is **tracked, not gated** — unlike consent, an unacked
announcement doesn't block the app (it surfaces on the dashboard in part 4). A
blocking variant could reuse the consent-gate pattern if a club needs it.

## Notifications (W7 part 2)

Migration `20260901210000_notification_prefs`. `Notification` gains `category`
(`NotificationCategory`) + `dedupeKey`; `NotificationPreference` is one row per
(user, category) with `email` / `push` toggles.

- **Categories** — `lib/notification-categories.ts` (client-safe: no DB import)
  maps every `NotificationType` → a category and holds the labels + defaults
  (push on, email off — no mail provider on the free tier).
- **De-dup** — `notifyUsers`/`notifyUser` take an optional `dedupeKey`; a fresh
  notification with the same key deletes any earlier *unread* one for that user,
  so re-editing an event doesn't stack. Event routes pass `event:{id}`.
- **Channel routing** — `sendPushToUsers(ids, payload, category?)` filters to
  users opted into push for that category (`lib/notifications.ts#optedIn`).
- **Feed** — `GET /api/v1/notifications?category=&unread=1` → `{ items,
  unreadCount }`. `GET|PATCH /api/v1/notifications/preferences`. UI at the shared
  `/notifications` (`components/notifications/NotificationsFeed.tsx` — day
  groups, category chips, mark-all, an inline settings table). Every role gets
  the nav bell now; `/player/notifications` redirects here.
- **Digest** — `lib/digest.ts#runNotificationDigest` runs from the daily cron:
  one summary email per user whose opted-in categories hold an unread item aged
  20–44h (so a same-day re-trigger doesn't re-send and read items drop out).

## Chat (W7 part 3)

Migration `20260902090000_messaging`. `Conversation` (`type` TEAM | EVENT |
GROUP | DIRECT, optional `teamId` / `eventId`, `safeguarded`, `lastMessageAt`),
`ConversationParticipant` (one row per member, `role` member|admin,
`viaGuardianship`, `lastReadAt`), `Message` (`body`, `editedAt`, `deletedAt`
for soft delete). `ClubSafeguardingPolicy` is one row per club, created lazily
with safe defaults.

- **Transport is polling.** The client re-fetches the list every 15s and the
  open thread every 4s (`GET /api/v1/conversations/{id}?after=<messageId>`).
  `lib/chat.ts#postMessage` is the single publish point, so a realtime adapter
  (Pusher/Ably/WS) can slot in later without touching call sites.
- **Team channels are implicit.** `ensureTeamConversation(teamId)` finds-or-
  creates the `type:TEAM` conversation and re-syncs its participants to the
  current roster + staff (+ guardians) on every list fetch. Members are added,
  never auto-removed — history stays intact. `GET /api/v1/conversations` ensures
  the caller's team channel(s) before returning.
- **Safeguarding** (`lib/safeguarding.ts`, brief §13). A conversation is
  `safeguarded` when it contains a minor (per `Club.minorAgeThreshold`). Then:
  - guardians of every minor are auto-added as participants
    (`viaGuardianship: true`) when the conversation is created / synced;
  - `directMessageAllowed()` blocks a 1:1 DM where exactly one of the two is a
    minor (adult↔adult and minor↔minor are fine). Pure + unit-tested
    (`lib/safeguarding.test.ts`); `createConversation` calls it.
  - A club admin can loosen either rule via `ClubSafeguardingPolicy`
    (`blockAdultMinorDirectMessages`, `guardianAutoIncludedWithMinor`).
- **Endpoints** — `GET|POST /api/v1/conversations`, `GET
  /api/v1/conversations/contacts` (people you share a team with), `GET
  /api/v1/conversations/{id}`, `POST /api/v1/conversations/{id}/messages`,
  `POST /api/v1/conversations/{id}/read`, `PATCH|DELETE /api/v1/messages/{id}`
  (edit is author-only within 15 min; delete is author / conversation admin /
  club admin → soft delete).
- **Notifications** — `postMessage` notifies the other participants with an
  explicit `category: "MESSAGES"` override (there's no `MESSAGE`
  `NotificationType`), de-duped on `conversation:{id}`, then pushes to those
  opted into that category.
- **Surface** — `/messages`, shared by every role (nav capability `messages`).
  `components/messages/MessagesClient.tsx`: two-pane on `md+`, list→thread on
  mobile with a back control; a "New" dialog picks one contact for a DM or
  several for a group.

Known limitation: a group created *before* one of its members gained a guardian
relationship isn't retro-synced (only team channels re-sync). New conversations
and all DMs are covered.

## Still to come (W7)

- Part 4 — dashboard polish (unacked announcements, unread messages, pending
  RSVPs, outstanding consent) + the admin audit-log viewer.
