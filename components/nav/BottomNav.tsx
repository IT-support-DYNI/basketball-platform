"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";

import { cn } from "@/lib/cn";
import type { NavItem } from "@/lib/navigation";
import NavIcon from "./NavIcon";
import ThemeToggle from "../theme/ThemeToggle";
import LogoutButton from "../LogoutButton";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The app-style navigation used at every breakpoint: a fixed bottom bar with up
 * to four primary destinations plus a "More" tab that opens a drawer holding the
 * full menu, account identity, theme toggle and sign-out. The bar spans the
 * viewport but its contents are centred and width-capped so it reads as a dock
 * on wide screens rather than stretching edge to edge.
 */
export default function BottomNav({
  primary,
  all,
  userName,
  userRole,
}: {
  primary: NavItem[];
  all: NavItem[];
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const moreActive = all.some(
    (item) => !primary.some((p) => p.href === item.href) && isActive(pathname, item.href),
  );

  const tab =
    "flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-[10px] font-medium tracking-wide transition";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ground/95 backdrop-blur-md"
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

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            className={cn(tab, moreActive || open ? "text-flame-ink" : "text-ink-dim hover:text-ink")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              <circle cx="5" cy="12" r="1.4" />
              <circle cx="12" cy="12" r="1.4" />
              <circle cx="19" cy="12" r="1.4" />
            </svg>
            More
          </Dialog.Trigger>

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
      </div>
    </nav>
  );
}
