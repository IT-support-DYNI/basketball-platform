import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  COACH: "/coach/dashboard",
  PLAYER: "/player/dashboard",
};

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  redirect(session?.user ? ROLE_HOME[session.user.role] ?? "/login" : "/login");
}
