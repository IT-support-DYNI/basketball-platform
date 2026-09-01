/**
 * OpenAPI description of /api/v1.
 *
 * Endpoints are declared in the registry below and assembled into an OpenAPI 3.1
 * document served at GET /api/v1/openapi.json. Request/response *body* schemas
 * are referenced by name and filled in incrementally from the `contracts`
 * package as each module is rebuilt (a `zod-to-openapi` pass is the follow-up);
 * the shared pieces — auth, the error envelope, list params — are complete.
 */

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  summary: string;
  tag: string;
  auth: "none" | "user" | "admin" | "coach";
  list?: boolean;
};

const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/openapi.json", summary: "This document", tag: "Meta", auth: "none" },

  { method: "POST", path: "/register", summary: "Submit a player registration (self, 18+)", tag: "Auth", auth: "none" },
  { method: "POST", path: "/register/guardian", summary: "A guardian registers a minor", tag: "Auth", auth: "none" },
  { method: "POST", path: "/registration/draft", summary: "Begin / resume a saved registration", tag: "Auth", auth: "none" },
  { method: "GET", path: "/registration/draft", summary: "The registration in progress (cookie)", tag: "Auth", auth: "none" },
  { method: "PATCH", path: "/registration/draft", summary: "Save a registration step", tag: "Auth", auth: "none" },
  { method: "POST", path: "/registration/draft/submit", summary: "Finish a saved registration", tag: "Auth", auth: "none" },
  { method: "POST", path: "/auth/forgot-password", summary: "Request a password-reset link", tag: "Auth", auth: "none" },
  { method: "POST", path: "/auth/reset-password", summary: "Set a new password from a reset token", tag: "Auth", auth: "none" },
  { method: "POST", path: "/auth/verify-email", summary: "Confirm an email address from its token", tag: "Auth", auth: "none" },
  { method: "POST", path: "/auth/resend-verification", summary: "Re-send the confirmation email", tag: "Auth", auth: "user" },
  { method: "GET", path: "/auth/login-status", summary: "Whether an email is currently locked out", tag: "Auth", auth: "none" },
  { method: "GET", path: "/auth/mfa", summary: "The caller's two-factor status", tag: "Auth", auth: "user" },
  { method: "POST", path: "/auth/mfa/setup", summary: "Begin two-factor enrollment", tag: "Auth", auth: "user" },
  { method: "POST", path: "/auth/mfa/enable", summary: "Confirm enrollment, get recovery codes", tag: "Auth", auth: "user" },
  { method: "POST", path: "/auth/mfa/disable", summary: "Turn two-factor off", tag: "Auth", auth: "user" },
  { method: "GET", path: "/auth/sessions", summary: "Active device sessions", tag: "Auth", auth: "user" },
  { method: "DELETE", path: "/auth/sessions/{id}", summary: "Sign a device out", tag: "Auth", auth: "user" },
  { method: "POST", path: "/auth/sessions/revoke-others", summary: "Sign out every other device", tag: "Auth", auth: "user" },
  { method: "GET", path: "/public/teams", summary: "Teams open for registration", tag: "Public", auth: "none" },

  { method: "GET", path: "/teams", summary: "List teams in scope", tag: "Teams", auth: "user" },
  { method: "POST", path: "/teams", summary: "Create a team", tag: "Teams", auth: "admin" },
  { method: "GET", path: "/teams/{id}", summary: "Get a team", tag: "Teams", auth: "user" },
  { method: "PATCH", path: "/teams/{id}", summary: "Update a team", tag: "Teams", auth: "admin" },
  { method: "DELETE", path: "/teams/{id}", summary: "Delete a team", tag: "Teams", auth: "admin" },
  { method: "POST", path: "/teams/{id}/coaches", summary: "Assign a coach", tag: "Teams", auth: "admin" },
  { method: "DELETE", path: "/teams/{id}/coaches/{coachId}", summary: "Remove a coach", tag: "Teams", auth: "admin" },
  { method: "GET", path: "/teams/{id}/players", summary: "Team roster for a season", tag: "Teams", auth: "user" },
  { method: "POST", path: "/teams/{id}/players", summary: "Provision a player + add to the roster", tag: "Teams", auth: "coach" },
  { method: "DELETE", path: "/teams/{id}/players/{playerId}", summary: "Remove a player from the roster (membership -> FORMER)", tag: "Teams", auth: "coach" },
  { method: "POST", path: "/teams/{id}/roster", summary: "Add an existing player to the roster", tag: "Organisation", auth: "coach" },
  { method: "GET", path: "/teams/{id}/roster/export", summary: "Roster as CSV", tag: "Organisation", auth: "coach" },
  { method: "GET", path: "/teams/{id}/staff", summary: "A team's staff", tag: "Organisation", auth: "user" },
  { method: "POST", path: "/teams/{id}/staff", summary: "Assign a staff member", tag: "Organisation", auth: "admin" },
  { method: "DELETE", path: "/teams/{id}/staff/{assignmentId}", summary: "Remove a staff assignment", tag: "Organisation", auth: "admin" },
  { method: "GET", path: "/players", summary: "Approved players (roster picker)", tag: "People", auth: "coach" },
  { method: "GET", path: "/players/{id}/memberships", summary: "A player's team history", tag: "Organisation", auth: "user" },
  { method: "GET", path: "/teams/{id}/squads", summary: "A team's squads for a season", tag: "Organisation", auth: "user" },
  { method: "POST", path: "/teams/{id}/squads", summary: "Create a squad", tag: "Organisation", auth: "admin" },
  { method: "PATCH", path: "/teams/{id}/squads/{squadId}", summary: "Update a squad", tag: "Organisation", auth: "admin" },
  { method: "DELETE", path: "/teams/{id}/squads/{squadId}", summary: "Delete a squad", tag: "Organisation", auth: "admin" },
  { method: "PATCH", path: "/memberships/{id}", summary: "Change jersey / position / squad / status", tag: "Organisation", auth: "coach" },
  { method: "GET", path: "/seasons", summary: "The club's seasons", tag: "Organisation", auth: "user" },
  { method: "POST", path: "/seasons", summary: "Create a season", tag: "Organisation", auth: "admin" },
  { method: "PATCH", path: "/seasons/{id}", summary: "Update / activate a season", tag: "Organisation", auth: "admin" },
  { method: "GET", path: "/events", summary: "Calendar feed (from/to/teamId/type filters)", tag: "Scheduling", auth: "user", list: true },
  { method: "POST", path: "/events", summary: "Create an event", tag: "Scheduling", auth: "coach" },
  { method: "GET", path: "/events/{id}", summary: "Get an event", tag: "Scheduling", auth: "user" },
  { method: "PATCH", path: "/events/{id}", summary: "Update / cancel an event", tag: "Scheduling", auth: "coach" },
  { method: "DELETE", path: "/events/{id}", summary: "Cancel an event", tag: "Scheduling", auth: "coach" },
  { method: "GET", path: "/events/{id}/attendance", summary: "Event attendance", tag: "Attendance", auth: "user" },
  { method: "PUT", path: "/events/{id}/attendance", summary: "Record attendance", tag: "Attendance", auth: "coach" },
  { method: "POST", path: "/events/{id}/checkin", summary: "Self check-in (QR token or venue PIN)", tag: "Attendance", auth: "user" },
  { method: "POST", path: "/events/{id}/checkout", summary: "Self check-out", tag: "Attendance", auth: "user" },
  { method: "GET", path: "/events/{id}/qr", summary: "Mint a rotating check-in QR token", tag: "Attendance", auth: "coach" },
  { method: "PATCH", path: "/attendance/{id}", summary: "Correct a record (reason required, audited)", tag: "Attendance", auth: "coach" },
  { method: "GET", path: "/attendance/{id}/audit", summary: "Correction history for a record", tag: "Attendance", auth: "coach" },
  { method: "GET", path: "/reports/attendance", summary: "Per-player attendance over a window (?format=csv)", tag: "Attendance", auth: "coach" },
  { method: "GET", path: "/consent-documents", summary: "All consent documents + acceptance counts", tag: "Consent", auth: "admin" },
  { method: "POST", path: "/consent-documents", summary: "Create a consent document (+ first version)", tag: "Consent", auth: "admin" },
  { method: "PATCH", path: "/consent-documents/{id}", summary: "Rename / retire / toggle required", tag: "Consent", auth: "admin" },
  { method: "POST", path: "/consent-documents/{id}/versions", summary: "Publish a new version", tag: "Consent", auth: "admin" },
  { method: "GET", path: "/audit", summary: "Append-only activity log (?action=, ?entityType=, ?actorUserId=)", tag: "Auth", auth: "admin", list: true },
  { method: "GET", path: "/account/export", summary: "Download your own data as JSON", tag: "Auth", auth: "user" },
  { method: "DELETE", path: "/account", summary: "Close your own account (anonymises; password-confirmed)", tag: "Auth", auth: "user" },
  { method: "GET", path: "/notifications", summary: "Your feed (?category=, ?unread=1) + unread count", tag: "Communication", auth: "user" },
  { method: "GET", path: "/notifications/preferences", summary: "Your per-category channel preferences", tag: "Communication", auth: "user" },
  { method: "PATCH", path: "/notifications/preferences", summary: "Set a category's channels", tag: "Communication", auth: "user" },
  { method: "GET", path: "/announcements", summary: "Visible announcements + your ack state", tag: "Communication", auth: "user" },
  { method: "POST", path: "/announcements", summary: "Post an announcement", tag: "Communication", auth: "coach" },
  { method: "DELETE", path: "/announcements/{id}", summary: "Remove an announcement", tag: "Communication", auth: "coach" },
  { method: "POST", path: "/announcements/{id}/ack", summary: "Acknowledge an announcement", tag: "Communication", auth: "user" },
  { method: "GET", path: "/announcements/{id}/acks", summary: "Who has / hasn't acknowledged", tag: "Communication", auth: "coach" },
  { method: "GET", path: "/conversations", summary: "Your conversations (team channels ensured) + unread counts", tag: "Communication", auth: "user" },
  { method: "POST", path: "/conversations", summary: "Start a group or direct conversation (safeguarding enforced)", tag: "Communication", auth: "user" },
  { method: "GET", path: "/conversations/contacts", summary: "People you can start a conversation with", tag: "Communication", auth: "user" },
  { method: "GET", path: "/conversations/{id}", summary: "A conversation's messages (?after=) + participants", tag: "Communication", auth: "user" },
  { method: "POST", path: "/conversations/{id}/messages", summary: "Send a message", tag: "Communication", auth: "user" },
  { method: "POST", path: "/conversations/{id}/read", summary: "Mark the conversation read", tag: "Communication", auth: "user" },
  { method: "PATCH", path: "/messages/{id}", summary: "Edit your message (15-minute window)", tag: "Communication", auth: "user" },
  { method: "DELETE", path: "/messages/{id}", summary: "Remove a message (author / conversation admin / club admin)", tag: "Communication", auth: "user" },
  { method: "GET", path: "/consent", summary: "The caller's consent checklist", tag: "Consent", auth: "user" },
  { method: "POST", path: "/consent/accept", summary: "Accept one or more current versions", tag: "Consent", auth: "user" },
  { method: "GET", path: "/events/{id}/rsvp", summary: "Your RSVP + a summary (staff get the breakdown)", tag: "Scheduling", auth: "user" },
  { method: "POST", path: "/events/{id}/rsvp", summary: "Set or change your RSVP", tag: "Scheduling", auth: "user" },
  { method: "DELETE", path: "/events/{id}/rsvp", summary: "Clear your RSVP", tag: "Scheduling", auth: "user" },
  { method: "GET", path: "/events/{id}/ics", summary: "One event as an .ics file", tag: "Scheduling", auth: "user" },
  { method: "GET", path: "/calendar/token", summary: "Personal calendar subscription URL", tag: "Scheduling", auth: "user" },
  { method: "POST", path: "/calendar/token", summary: "Rotate the subscription token", tag: "Scheduling", auth: "user" },
  { method: "GET", path: "/public/calendar.ics", summary: "Personal calendar feed (token in query)", tag: "Public", auth: "none" },
  { method: "GET", path: "/venues", summary: "The club's venues", tag: "Scheduling", auth: "user" },
  { method: "POST", path: "/venues", summary: "Create a venue", tag: "Scheduling", auth: "admin" },
  { method: "PATCH", path: "/venues/{id}", summary: "Update a venue", tag: "Scheduling", auth: "admin" },
  { method: "DELETE", path: "/venues/{id}", summary: "Delete a venue", tag: "Scheduling", auth: "admin" },

  { method: "GET", path: "/players/{id}", summary: "Player profile (viewer-scoped fields)", tag: "People", auth: "user" },
  { method: "PATCH", path: "/players/{id}", summary: "Update a player", tag: "People", auth: "user" },
  { method: "GET", path: "/players/{id}/attendance", summary: "Player attendance history", tag: "Attendance", auth: "user" },
  { method: "GET", path: "/players/{id}/evaluations", summary: "Player evaluations", tag: "Development", auth: "user" },
  { method: "GET", path: "/players/{id}/feedback", summary: "Player feedback", tag: "Development", auth: "user" },
  { method: "POST", path: "/players/{id}/resubmit-registration", summary: "Resubmit a registration", tag: "Auth", auth: "user" },

  { method: "GET", path: "/registrations", summary: "Pending registrations", tag: "Auth", auth: "admin", list: true },
  { method: "PATCH", path: "/registrations/{id}", summary: "Approve / reject / request changes", tag: "Auth", auth: "admin" },

  { method: "GET", path: "/users", summary: "List users", tag: "People", auth: "admin", list: true },
  { method: "POST", path: "/users", summary: "Create a staff account", tag: "People", auth: "admin" },
  { method: "GET", path: "/users/{id}", summary: "Get a user", tag: "People", auth: "admin" },
  { method: "PATCH", path: "/users/{id}", summary: "Update / deactivate a user", tag: "People", auth: "admin" },
  { method: "GET", path: "/coaches/{id}", summary: "Get a coach", tag: "People", auth: "user" },

  { method: "GET", path: "/announcements", summary: "Announcements in scope", tag: "Communication", auth: "user", list: true },
  { method: "POST", path: "/announcements", summary: "Post an announcement", tag: "Communication", auth: "coach" },
  { method: "DELETE", path: "/announcements/{id}", summary: "Delete an announcement", tag: "Communication", auth: "coach" },
  { method: "GET", path: "/notifications", summary: "Own notifications", tag: "Communication", auth: "user", list: true },
  { method: "PATCH", path: "/notifications/{id}/read", summary: "Mark a notification read", tag: "Communication", auth: "user" },
  { method: "PATCH", path: "/notifications/read-all", summary: "Mark all read", tag: "Communication", auth: "user" },
  { method: "POST", path: "/push/subscribe", summary: "Register a web-push subscription", tag: "Communication", auth: "user" },
  { method: "DELETE", path: "/push/subscribe", summary: "Remove a web-push subscription", tag: "Communication", auth: "user" },

  { method: "POST", path: "/evaluations", summary: "Record an evaluation", tag: "Development", auth: "coach" },
  { method: "GET", path: "/evaluations/{id}", summary: "Get an evaluation", tag: "Development", auth: "user" },
  { method: "PATCH", path: "/evaluations/{id}", summary: "Update an evaluation", tag: "Development", auth: "coach" },
  { method: "POST", path: "/feedback", summary: "Write feedback", tag: "Development", auth: "coach" },

  { method: "GET", path: "/videos", summary: "Videos visible to the caller", tag: "Video", auth: "user", list: true },
  { method: "POST", path: "/videos", summary: "Create a video record", tag: "Video", auth: "coach" },
  { method: "POST", path: "/videos/upload-url", summary: "Get a presigned upload URL", tag: "Video", auth: "coach" },
  { method: "GET", path: "/videos/{id}", summary: "Get a video (signed playback URL)", tag: "Video", auth: "user" },
  { method: "DELETE", path: "/videos/{id}", summary: "Delete a video", tag: "Video", auth: "coach" },
  { method: "POST", path: "/videos/{id}/assign", summary: "Assign a video to a team / players", tag: "Video", auth: "coach" },

  { method: "GET", path: "/dashboard", summary: "Role-shaped dashboard payload", tag: "Meta", auth: "user" },
];

const errorSchema = {
  type: "object",
  required: ["error", "code", "requestId"],
  properties: {
    error: { type: "string", description: "Human-readable message." },
    code: {
      type: "string",
      enum: ["BAD_REQUEST", "VALIDATION", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "RATE_LIMITED", "INTERNAL"],
    },
    requestId: { type: "string", format: "uuid" },
    details: { description: "Machine-readable context, e.g. per-field validation errors." },
  },
} as const;

const listParams = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
  { name: "sort", in: "query", schema: { type: "string" }, description: "field or -field (descending)" },
  { name: "q", in: "query", schema: { type: "string" } },
];

const standardResponses = {
  "400": { description: "Bad request", content: { "application/json": { schema: errorSchema } } },
  "401": { description: "Not signed in", content: { "application/json": { schema: errorSchema } } },
  "403": { description: "Forbidden", content: { "application/json": { schema: errorSchema } } },
  "404": { description: "Not found", content: { "application/json": { schema: errorSchema } } },
  "422": { description: "Validation failed", content: { "application/json": { schema: errorSchema } } },
  "429": { description: "Rate limited", content: { "application/json": { schema: errorSchema } } },
};

export function buildOpenApiDocument() {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const ep of ENDPOINTS) {
    const openApiPath = `/api/v1${ep.path}`;
    paths[openApiPath] ??= {};

    const pathParams = [...ep.path.matchAll(/\{(\w+)\}/g)].map((m) => ({
      name: m[1],
      in: "path",
      required: true,
      schema: { type: "integer" as const },
    }));

    paths[openApiPath][ep.method.toLowerCase()] = {
      summary: ep.summary,
      tags: [ep.tag],
      security: ep.auth === "none" ? [] : [{ sessionCookie: [] }],
      parameters: [...pathParams, ...(ep.list ? listParams : [])],
      responses: {
        "200": { description: "OK" },
        ...standardResponses,
      },
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "DYNI Blazers API",
      version: "1.0.0",
      description:
        "Versioned REST API for the DYNI Blazers club platform. All responses carry an `x-request-id` header; errors share a single envelope. Authentication is a NextAuth session cookie.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        sessionCookie: { type: "apiKey", in: "cookie", name: "next-auth.session-token" },
      },
      schemas: { Error: errorSchema },
    },
    paths,
  };
}
