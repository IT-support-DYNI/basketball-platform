import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { hasOutstandingConsent } from "@/lib/consent";
import AppContainer from "@/components/app/AppContainer";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PLAYER") redirect("/login");

  // Blocking consent gate: an approved player with an unaccepted required
  // document can't use /player/* until they've dealt with it (brief §24).
  if (
    session.user.registrationStatus === "APPROVED" &&
    session.user.playerId &&
    (await hasOutstandingConsent(session.user.playerId))
  ) {
    redirect("/consent");
  }

  return <AppContainer>{children}</AppContainer>;
}
