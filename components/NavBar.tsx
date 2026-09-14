import { getServerSession } from "next-auth";
import { headers } from "next/headers";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { navFor, primaryNavFor } from "@/lib/navigation";
import PrimaryNav from "./nav/PrimaryNav";

export default async function NavBar() {
  // The public club site (/club/*) is a deliberately separate surface with
  // its own header/footer — a visitor browsing it shouldn't see the internal
  // app's nav, and neither should a staff member who's also logged in and
  // happens to be previewing it. middleware.ts stamps the real pathname onto
  // every request (see nextWithPathname) since a Server Component otherwise
  // has no reliable way to know what route it's rendering under.
  const pathname = headers().get("x-pathname") ?? "";
  if (pathname === "/club" || pathname.startsWith("/club/")) return null;

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
