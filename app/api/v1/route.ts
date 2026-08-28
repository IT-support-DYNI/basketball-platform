import { route, ok } from "@/lib/api";

/** GET /api/v1 — a friendly index. Public. */
export const GET = route((_req, { requestId }) =>
  ok(
    {
      name: "DYNI Blazers API",
      version: "1.0.0",
      docs: "/api/v1/openapi.json",
      notes: [
        "Every response carries an x-request-id header.",
        "Errors share one shape: { error, code, requestId, details? }.",
        "Auth is a NextAuth session cookie.",
        "Lists accept ?page=&pageSize=&sort=&q=.",
      ],
    },
    { requestId },
  ),
);
