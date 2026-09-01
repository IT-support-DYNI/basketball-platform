import { route, ok } from "@/lib/api";
import { buildOpenApiDocument } from "@/lib/api/openapi";

/** GET /api/v1/openapi.json — the OpenAPI 3.1 description of this API. Public. */
export const GET = route((_req, { requestId }) => ok(buildOpenApiDocument(), { requestId }));
