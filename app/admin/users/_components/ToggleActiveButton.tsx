"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ToggleActiveButton({ userId, isActive }: { userId: number; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/v1/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
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
      className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        isActive ? "bg-danger/10 text-danger hover:bg-danger/20" : "bg-success/10 text-success hover:bg-success/20"
      }`}
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
