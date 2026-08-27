"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-dim transition hover:border-line-strong hover:bg-surface-2 hover:text-ink"
    >
      Log out
    </button>
  );
}
