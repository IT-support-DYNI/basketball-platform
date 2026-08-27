import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./LogoutButton";

/** Nav maps match PRD §5.1 exactly, one per role. */
const NAV_LINKS: Record<string, { label: string; href: string }[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Registrations", href: "/admin/registrations" },
    { label: "Users", href: "/admin/users" },
    { label: "Teams", href: "/admin/teams" },
    { label: "Coaches", href: "/admin/coaches" },
    { label: "Players", href: "/admin/players" },
    { label: "Training", href: "/admin/training" },
    { label: "Attendance", href: "/admin/attendance" },
    { label: "Performance", href: "/admin/performance" },
    { label: "Settings", href: "/admin/settings" },
  ],
  COACH: [
    { label: "Dashboard", href: "/coach/dashboard" },
    { label: "My Teams", href: "/coach/my-teams" },
    { label: "Players", href: "/coach/players" },
    { label: "Training", href: "/coach/training" },
    { label: "Attendance", href: "/coach/attendance" },
    { label: "Videos", href: "/coach/videos" },
    { label: "Performance", href: "/coach/performance" },
    { label: "Announcements", href: "/coach/announcements" },
  ],
  PLAYER: [
    { label: "Dashboard", href: "/player/dashboard" },
    { label: "My Team", href: "/player/my-team" },
    { label: "Training", href: "/player/training" },
    { label: "Attendance", href: "/player/attendance" },
    { label: "Videos", href: "/player/videos" },
    { label: "Performance", href: "/player/performance" },
    { label: "Feedback", href: "/player/feedback" },
    { label: "Notifications", href: "/player/notifications" },
    { label: "Profile", href: "/player/profile" },
  ],
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  COACH: "bg-sky-100 text-sky-700",
  PLAYER: "bg-court-100 text-court-700",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function NavBar() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const links = NAV_LINKS[session.user.role] ?? [];
  const homeHref = links[0]?.href ?? "/";

  const unreadCount =
    session.user.role === "PLAYER"
      ? await prisma.notification.count({
          where: { userId: Number(session.user.id), isRead: false },
        })
      : 0;

  const navLinkClass =
    "whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-court-500 to-court-700 text-lg shadow-sm shadow-court-500/30">
            🏀
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Hoops<span className="text-court-600">Platform</span>
          </span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {session.user.role === "PLAYER" && (
            <Link
              href="/player/notifications"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 shadow-sm sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white">
              {initials(session.user.name ?? "?")}
            </span>
            <p className="text-sm font-semibold text-slate-800">{session.user.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${ROLE_STYLES[session.user.role]}`}>
              {session.user.role}
            </span>
          </div>

          <LogoutButton />
        </div>
      </nav>
    </header>
  );
}
