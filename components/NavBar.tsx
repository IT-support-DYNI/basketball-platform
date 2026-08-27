import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Brandmark from "./Brandmark";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./theme/ThemeToggle";

/**
 * Role-aware top nav. Phase 1 keeps the per-role link maps below; the plan's
 * W1 step folds these into a single permission-keyed menu config once the
 * expanded role set lands. Nav labels track the DYNI brief §38.
 */
const NAV_LINKS: Record<string, { label: string; href: string }[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Registrations", href: "/admin/registrations" },
    { label: "Members", href: "/admin/users" },
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
    { label: "Team", href: "/coach/my-teams" },
    { label: "Players", href: "/coach/players" },
    { label: "Training", href: "/coach/training" },
    { label: "Attendance", href: "/coach/attendance" },
    { label: "Videos", href: "/coach/videos" },
    { label: "Performance", href: "/coach/performance" },
    { label: "Announcements", href: "/coach/announcements" },
  ],
  PLAYER: [
    { label: "Home", href: "/player/dashboard" },
    { label: "My Team", href: "/player/my-team" },
    { label: "Training", href: "/player/training" },
    { label: "Attendance", href: "/player/attendance" },
    { label: "Videos", href: "/player/videos" },
    { label: "Performance", href: "/player/performance" },
    { label: "Feedback", href: "/player/feedback" },
    { label: "Profile", href: "/player/profile" },
  ],
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "border-info/40 text-info",
  COACH: "border-ember/40 text-ember",
  PLAYER: "border-flame/40 text-flame-ink",
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
    "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-ink-dim transition hover:bg-surface-2 hover:text-ink";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-2.5">
        <Brandmark size="sm" href={homeHref} className="shrink-0" />

        <div className="flex flex-1 flex-wrap items-center gap-0.5 overflow-x-auto">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {session.user.role === "PLAYER" && (
            <Link
              href="/player/notifications"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-dim transition hover:bg-surface-2 hover:text-ink"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-flame px-1 text-[10px] font-bold text-on-flame ring-2 ring-ground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <ThemeToggle />

          <div className="hidden items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-3 font-condensed text-xs font-bold text-ink">
              {initials(session.user.name ?? "?")}
            </span>
            <p className="text-sm font-semibold text-ink">{session.user.name}</p>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
                ROLE_STYLES[session.user.role] ?? "border-line text-ink-dim"
              }`}
            >
              {session.user.role}
            </span>
          </div>

          <LogoutButton />
        </div>
      </nav>
    </header>
  );
}
