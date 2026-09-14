"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ArchiveTeamButton({ teamId, status }: { teamId: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nextStatus = status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/v1/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
    >
      {status === "ACTIVE" ? "Archive team" : "Reactivate team"}
    </button>
  );
}
