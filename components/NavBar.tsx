import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { navFor, primaryNavFor } from "@/lib/navigation";
import PrimaryNav from "./nav/PrimaryNav";

export default async function NavBar() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const links = navFor(session.user.role);
  const primary = primaryNavFor(session.user.role);
  const homeHref = links[0]?.href ?? "/";

  // Everyone gets the notification bell now (W7).
  const unreadCount = await prisma.notification.count({
    where: { userId: Number(session.user.id), isRead: false },
  });

  return (
    <PrimaryNav
      primary={primary}
      all={links}
      homeHref={homeHref}
      userName={session.user.name ?? "Account"}
      userRole={session.user.role}
      showBell
      unreadCount={unreadCount}
    />
  );
}
