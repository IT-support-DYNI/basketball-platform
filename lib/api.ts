import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError } from "./authorization";

/** Turns thrown AuthorizationError/ZodError into the right HTTP response; anything else is a 500. */
export function apiError(error: unknown): NextResponse {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", issues: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

type RouteHandler<Context> = (req: NextRequest, context: Context) => Promise<NextResponse>;

/** Wraps a route handler so it doesn't need its own try/catch — see lib/authorization.ts for the errors this catches. */
export function withApi<Context = { params: Record<string, string> }>(
  handler: RouteHandler<Context>
): RouteHandler<Context> {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return apiError(error);
    }
  };
}
