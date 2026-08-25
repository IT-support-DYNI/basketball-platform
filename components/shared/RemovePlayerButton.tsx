"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RemovePlayerButton({ teamId, playerId }: { teamId: number; playerId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("Remove this player from the team roster? Their account stays, just unassigned.")) return;
    setLoading(true);
    try {
      await fetch(`/api/teams/${teamId}/players/${playerId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className="text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50">
      Remove
    </button>
  );
}
