"use client";

import { signOut } from "next-auth/react";

import { cn } from "@/lib/cn";

export default function LogoutButton({ className }: { className?: string }) {
  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-dim transition hover:border-line-strong hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      Log out
    </button>
  );
}
