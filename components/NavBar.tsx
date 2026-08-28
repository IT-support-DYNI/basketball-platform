import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { navFor, primaryNavFor } from "@/lib/navigation";
import Brandmark from "./Brandmark";
import BottomNav from "./nav/BottomNav";

export default async function NavBar() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const links = navFor(session.user.role);
  const primary = primaryNavFor(session.user.role);
  const homeHref = links[0]?.href ?? "/";

  const unreadCount =
    session.user.role === "PLAYER"
      ? await prisma.notification.count({
          where: { userId: Number(session.user.id), isRead: false },
        })
      : 0;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <Brandmark size="sm" href={homeHref} className="shrink-0" />

          {session.user.role === "PLAYER" && (
            <Link
              href="/player/notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-dim transition hover:bg-surface-2 hover:text-ink"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-flame px-1 text-[10px] font-bold text-on-flame ring-2 ring-ground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
        </nav>
      </header>

      <BottomNav
        primary={primary}
        all={links}
        userName={session.user.name ?? "Account"}
        userRole={session.user.role}
      />
    </>
  );
}
