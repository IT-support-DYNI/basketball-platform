import { NextRequest } from "next/server";

import { route, created } from "@/lib/api";
import { registerSchema } from "@/lib/contracts/registration";
import { createSelfRegistration } from "@/lib/registration";

/**
 * Public self-registration — DYNI Blazers PRD §6, Journey A. Unauthenticated.
 * Two gates apply before full access: email verification, and
 * PlayerProfile.registrationStatus (middleware routes anyone not APPROVED to
 * /registration-status). Shared logic in lib/registration.ts.
 */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const body = registerSchema.parse(await req.json());
  const result = await createSelfRegistration(body);
  return created(result, requestId);
});
