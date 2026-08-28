# DYNI Blazers API (`/api/v1`)

Versioned REST surface. A future React Native app consumes this exact API and
the same `contracts` schemas.

- **Base path:** `/api/v1` (the NextAuth routes stay at `/api/auth/*`).
- **Index:** `GET /api/v1` — capabilities summary.
- **Spec:** `GET /api/v1/openapi.json` — OpenAPI 3.1.
- **Auth:** NextAuth session cookie. Unauthenticated API calls get `401` JSON
  (not an HTML redirect).

## Response conventions

| | Shape |
|---|---|
| Success | the resource itself, or `{ items, page, pageSize, total, totalPages }` for paginated lists |
| Error | `{ "error": string, "code": string, "requestId": string, "details"?: unknown }` |
| Every response | `x-request-id` header (echoed from the request's, or generated) |

`error` is always a plain string (so `body.error` keeps working); `code` is the
machine-readable discriminator: `BAD_REQUEST` `VALIDATION` `UNAUTHORIZED`
`FORBIDDEN` `NOT_FOUND` `CONFLICT` `RATE_LIMITED` `INTERNAL`.

Lists accept `?page=` `?pageSize=` (max 100) `?sort=field` / `?sort=-field`
(descending) `?q=`.

## Writing a route

```ts
import { route, ok, created, NotFoundError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { getTenantContext, assertSameClub } from "@/lib/tenant";
import { createTeamSchema } from "@/lib/contracts/team";

export const POST = route(async (req, { requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const ctx = await getTenantContext(session);
  const body = createTeamSchema.parse(await req.json());   // ZodError -> 422
  const team = await prisma.team.create({ data: { ...body, clubId: ctx.clubId } });
  return created(team, requestId);
});
```

`route()` supplies `requestId`, catches `ApiError` / `ZodError` / anything else,
and never leaks an unexpected error's detail.

`app/api/v1/teams/route.ts` and `teams/[id]/route.ts` are the reference
implementations (tenancy scoping, response helpers, contracts).

## Tenancy

The platform runs one club but is multi-tenant. `lib/tenant.ts`:

- `getTenantContext(session)` → `{ clubId }` for the caller
- `assertSameClub(resourceClubId, ctx)` → `403` on a cross-club id
- `teamClubScope(ctx)` → a Prisma `where` fragment for `Team` queries

`Team.clubId` is still nullable (pre-`Club` teams); those are treated as
in-scope. **Follow-up:** make it `NOT NULL` (backfill migration) and add a
Prisma client extension so scoping is automatic rather than per-query.

## Migration status

All non-auth routes moved to `/api/v1` and onto the `route()` wrapper. The
response/error helpers and tenancy scoping are adopted in the Teams routes;
other routes still return their original bare bodies and are converted as their
module is rebuilt. OpenAPI currently documents every endpoint's path, method,
auth and the shared schemas — per-endpoint request/response bodies are filled
in from `contracts` during those rebuilds.
