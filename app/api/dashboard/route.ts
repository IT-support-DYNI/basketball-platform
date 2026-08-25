import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { getAdminDashboard, getCoachDashboard, getPlayerDashboard } from "@/lib/dashboard";

/** Returns the widgets for the caller's own role — shapes match PRD §5.2-5.4. Kept for any future non-web client; the dashboard pages themselves call lib/dashboard.ts directly. */
export const GET = withApi(async () => {
  const session = requireAuth(await getServerSession(authOptions));

  if (session.user.role === "ADMIN") {
    return NextResponse.json({ role: "ADMIN", ...(await getAdminDashboard()) });
  }
  if (session.user.role === "COACH") {
    return NextResponse.json({ role: "COACH", ...(await getCoachDashboard(session)) });
  }
  return NextResponse.json({ role: "PLAYER", ...(await getPlayerDashboard(session)) });
});
