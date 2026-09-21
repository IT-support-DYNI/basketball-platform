import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  COACH: "/coach/dashboard",
  PLAYER: "/player/dashboard",
  GUARDIAN: "/guardian",
};

/** Signed out (or an unrecognised role) lands on the public site, not the
 *  sign-in form — dyniblazers.co.uk should read as a club's front door, not
 *  a login screen. A signed-in visitor still goes straight to their own
 *  dashboard. */
export default async function RootPage() {
  const session = await getServerSession(authOptions);
  redirect(session?.user ? ROLE_HOME[session.user.role] ?? "/club" : "/club");
}
