import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { route, ok, created, NotFoundError } from "@/lib/api";
import { startDraftSchema, patchDraftSchema } from "@/lib/contracts/registration";
import { DRAFT_COOKIE, startDraft, getDraft, patchDraft } from "@/lib/registration-draft";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60,
};

/** POST — begin (or resume) a draft for an email. Sets the resume cookie. */
export const POST = route(async (req: NextRequest) => {
  const body = startDraftSchema.parse(await req.json());
  const { token, view } = await startDraft(body.email, body.mode);
  cookies().set(DRAFT_COOKIE, token, COOKIE_OPTS);
  return created(view);
});

/** GET — the current draft (from the cookie), or 404 if none / expired. */
export const GET = route(async () => {
  const token = cookies().get(DRAFT_COOKIE)?.value ?? "";
  const view = await getDraft(token);
  if (!view) throw new NotFoundError("No registration in progress.");
  return ok(view);
});

/** PATCH — save a step. */
export const PATCH = route(async (req: NextRequest) => {
  const token = cookies().get(DRAFT_COOKIE)?.value ?? "";
  const body = patchDraftSchema.parse(await req.json());
  const view = await patchDraft(token, body);
  return ok(view);
});
