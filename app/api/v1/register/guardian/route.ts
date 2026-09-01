import { NextRequest } from "next/server";

import { route, created } from "@/lib/api";
import { registerGuardianSchema } from "@/lib/contracts/registration";
import { createGuardianRegistration } from "@/lib/registration";

/**
 * Guardian-led registration for a minor (brief §25). Creates a GUARDIAN account,
 * a child PLAYER account + PlayerProfile (PENDING), and a GuardianRelationship.
 * Shared logic in lib/registration.ts.
 */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const body = registerGuardianSchema.parse(await req.json());
  const result = await createGuardianRegistration(body);
  return created(result, requestId);
});
