"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RemoveCoachButton({ teamId, coachProfileId }: { teamId: number; coachProfileId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/teams/${teamId}/coaches/${coachProfileId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50"
    >
      Remove
    </button>
  );
}
