"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";

import { cn } from "@/lib/cn";
import type { NavItem } from "@/lib/navigation";
import Brandmark from "../Brandmark";
import LogoutButton from "../LogoutButton";
import ThemeToggle from "../theme/ThemeToggle";
import NavIcon from "./NavIcon";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/player/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-dim transition hover:bg-surface-2 hover:text-ink"
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
  );
}

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5 lg:h-4 lg:w-4" aria-hidden="true">
    <circle cx="5" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="19" cy="12" r="1.4" />
  </svg>
);

/**
 * The one navigation, styled per breakpoint:
 *  - `lg`+  : a single sticky bar at the top — brand, the primary destinations
 *            as pills, a "More" button, and (players) the notification bell.
 *  - `<lg`  : a slim top bar (brand + bell) plus a fixed bottom bar with the
 *            same primary tabs + "More".
 * "More" opens a bottom-anchored drawer with the full menu, identity, theme
 * toggle and sign-out — shared by both layouts.
 */
export default function PrimaryNav({
  primary,
  all,
  homeHref,
  userName,
  userRole,
  showBell,
  unreadCount,
}: {
  primary: NavItem[];
  all: NavItem[];
  homeHref: string;
  userName: string;
  userRole: string;
  showBell: boolean;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const moreActive = all.some(
    (item) => !primary.some((p) => p.href === item.href) && isActive(pathname, item.href),
  );

  // desktop pill
  const pill =
    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition whitespace-nowrap";
  // mobile bottom tab
  const tab =
    "flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-[10px] font-medium tracking-wide transition";

  return (
    <>
      {/* ---- desktop: single top bar ---- */}
      <header className="sticky top-0 z-40 hidden border-b border-line bg-ground/85 backdrop-blur-md lg:block">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-8 py-2">
          <Brandmark size="sm" href={homeHref} className="shrink-0" />
          <nav aria-label="Primary" className="flex flex-1 items-center gap-1">
            {primary.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(pill, active ? "bg-flame/10 text-flame-ink" : "text-ink-dim hover:bg-surface-2 hover:text-ink")}
                >
                  <NavIcon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(pill, moreActive || open ? "bg-flame/10 text-flame-ink" : "text-ink-dim hover:bg-surface-2 hover:text-ink")}
            >
              <MoreIcon />
              More
            </button>
          </nav>
          {showBell && <NotificationBell unreadCount={unreadCount} />}
        </div>
      </header>

      {/* ---- mobile: slim top bar ---- */}
      <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Brandmark size="sm" href={homeHref} className="shrink-0" />
          {showBell && <NotificationBell unreadCount={unreadCount} />}
        </div>
      </header>

      {/* ---- mobile: fixed bottom bar ---- */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ground/95 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex w-full max-w-md">
          {primary.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(tab, active ? "text-flame-ink" : "text-ink-dim hover:text-ink")}
              >
                <NavIcon
                  name={item.icon}
                  className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgb(var(--flame)/0.5)]")}
                />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(tab, moreActive || open ? "text-flame-ink" : "text-ink-dim hover:text-ink")}
          >
            <MoreIcon />
            More
          </button>
        </div>
      </nav>

      {/* ---- shared "More" drawer ---- */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in motion-reduce:animate-none" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-[61] mx-auto max-h-[85vh] max-w-lg overflow-y-auto rounded-t-[20px] border border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-pop"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-5 py-3.5">
              <div className="min-w-0">
                <Dialog.Title className="truncate font-display text-sm font-bold uppercase tracking-tight text-ink">
                  {userName}
                </Dialog.Title>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{userRole}</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Dialog.Close
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint transition hover:bg-surface-2 hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </Dialog.Close>
              </div>
            </div>

            <ul className="grid grid-cols-2 gap-1.5 p-4 sm:grid-cols-3">
              {all.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-control border px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "border-flame/40 bg-flame/10 text-flame-ink"
                          : "border-line bg-surface-2 text-ink-dim hover:text-ink",
                      )}
                    >
                      <NavIcon name={item.icon} className="h-4 w-4 flex-none" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-line p-4">
              <LogoutButton className="w-full justify-center" />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
