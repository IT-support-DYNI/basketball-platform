import { cookies } from "next/headers";

import { route, created } from "@/lib/api";
import { DRAFT_COOKIE, submitDraft } from "@/lib/registration-draft";

/** POST — validate the assembled draft, create the account(s), clear the cookie. */
export const POST = route(async () => {
  const token = cookies().get(DRAFT_COOKIE)?.value ?? "";
  const out = await submitDraft(token);
  cookies().delete(DRAFT_COOKIE);
  return created(out);
});
