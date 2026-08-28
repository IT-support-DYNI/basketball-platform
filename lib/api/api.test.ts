import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

import { route } from "./route";
import { ok } from "./response";
import { parseListParams } from "./pagination";
import { ForbiddenError, NotFoundError } from "./errors";

function req(url = "http://localhost/api/v1/x", init?: { method?: string; body?: string }) {
  return new NextRequest(url, init);
}

describe("parseListParams", () => {
  it("applies defaults", () => {
    const p = parseListParams(new URLSearchParams(), { sortable: ["name"] });
    expect(p).toMatchObject({ page: 1, pageSize: 25, skip: 0, take: 25, sort: null, q: null });
  });

  it("clamps pageSize and computes skip", () => {
    const p = parseListParams(new URLSearchParams("page=3&pageSize=999"), { sortable: [] });
    expect(p.pageSize).toBe(100);
    expect(p.skip).toBe(200);
  });

  it("parses -field as descending and rejects unknown sort fields", () => {
    const ok_ = parseListParams(new URLSearchParams("sort=-createdAt"), { sortable: ["createdAt"] });
    expect(ok_.sort).toEqual({ field: "createdAt", dir: "desc" });
    expect(() => parseListParams(new URLSearchParams("sort=nope"), { sortable: ["createdAt"] })).toThrow();
  });
});

describe("route() wrapper", () => {
  it("echoes a request id and lets the handler set the body", async () => {
    const handler = route((_r, { requestId }) => ok({ hi: true }, { requestId }));
    const res = await handler(req(), { params: {} });
    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(await res.json()).toEqual({ hi: true });
  });

  it("maps ApiError to its status + code", async () => {
    const handler = route(() => {
      throw new ForbiddenError("nope");
    });
    const res = await handler(req(), { params: {} });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toMatchObject({ error: "nope", code: "FORBIDDEN" });
    expect(body.requestId).toBe(res.headers.get("x-request-id"));
  });

  it("maps a ZodError to 422 with field details", async () => {
    const schema = z.object({ name: z.string().min(1) });
    const handler = route(async (r) => ok(schema.parse(await r.json())));
    const res = await handler(
      req("http://localhost/api/v1/x", { method: "POST", body: JSON.stringify({ name: "" }) }),
      { params: {} },
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION");
    expect(body.details.name).toBeDefined();
  });

  it("hides unexpected errors behind a 500", async () => {
    const handler = route(() => {
      throw new Error("boom internal detail");
    });
    const res = await handler(req(), { params: {} });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("INTERNAL");
    expect(body.error).not.toContain("boom");
  });

  it("passes NotFoundError through as 404", async () => {
    const handler = route(() => {
      throw new NotFoundError();
    });
    const res = await handler(req(), { params: {} });
    expect(res.status).toBe(404);
  });
});
