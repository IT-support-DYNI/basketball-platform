import { NextResponse } from "next/server";

/**
 * Response helpers for /api/v1.
 *
 * Success bodies are the resource itself (or a `{ items, page, … }` envelope for
 * paginated lists) — deliberately not wrapped in `{ data }`, to keep clients
 * simple and stay compatible with the routes that predate this module.
 *
 * Error bodies are always the same shape:
 *   { error: string, code: string, requestId: string, details?: unknown }
 * `error` stays a plain string so existing `body.error` reads keep working;
 * `code` is the machine-readable discriminator.
 */

const REQUEST_ID_HEADER = "x-request-id";

function withRequestId(res: NextResponse, requestId: string) {
  res.headers.set(REQUEST_ID_HEADER, requestId);
  return res;
}

export function ok<T>(data: T, init?: { status?: number; requestId?: string; headers?: HeadersInit }) {
  const res = NextResponse.json(data, { status: init?.status ?? 200, headers: init?.headers });
  return init?.requestId ? withRequestId(res, init.requestId) : res;
}

export function created<T>(data: T, requestId?: string) {
  return ok(data, { status: 201, requestId });
}

export function noContent(requestId?: string) {
  const res = new NextResponse(null, { status: 204 });
  return requestId ? withRequestId(res, requestId) : res;
}

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function paginated<T>(
  items: T[],
  meta: { page: number; pageSize: number; total: number },
  requestId?: string,
) {
  const body: Page<T> = {
    items,
    page: meta.page,
    pageSize: meta.pageSize,
    total: meta.total,
    totalPages: Math.max(1, Math.ceil(meta.total / meta.pageSize)),
  };
  return ok(body, { requestId });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
) {
  return withRequestId(
    NextResponse.json(
      details === undefined
        ? { error: message, code, requestId }
        : { error: message, code, requestId, details },
      { status },
    ),
    requestId,
  );
}
