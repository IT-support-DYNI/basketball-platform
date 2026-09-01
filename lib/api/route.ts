import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { ApiError } from "./errors";
import { errorResponse } from "./response";

/**
 * Wraps a route handler so every /api/v1 endpoint gets:
 *  - a request id (from the inbound `x-request-id` header, or generated),
 *    echoed on every response and attached to logs
 *  - consistent error handling: ApiError → its status/code; ZodError → 422
 *    VALIDATION with per-field details; anything else → 500 INTERNAL with no
 *    detail leaked (the real error is logged with the request id)
 *
 * `withApi` is kept as an alias so routes not yet migrated keep working.
 */

export type RouteContext<P = Record<string, string>> = { params: P };
type Handler<P> = (
  req: NextRequest,
  ctx: RouteContext<P> & { requestId: string },
) => Promise<NextResponse> | NextResponse;

export function route<P = Record<string, string>>(handler: Handler<P>) {
  return async (req: NextRequest, ctx: RouteContext<P>): Promise<NextResponse> => {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

    try {
      const res = await handler(req, { ...ctx, requestId });
      if (!res.headers.has("x-request-id")) res.headers.set("x-request-id", requestId);
      return res;
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.status, err.code, err.message, requestId, err.details);
      }
      if (err instanceof ZodError) {
        return errorResponse(
          422,
          "VALIDATION",
          "Some fields need attention.",
          requestId,
          err.flatten().fieldErrors,
        );
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname} (${requestId})`, err);
      return errorResponse(500, "INTERNAL", "Something went wrong on our end.", requestId);
    }
  };
}

/** @deprecated use `route` — kept so un-migrated handlers keep compiling. */
export const withApi = route;
