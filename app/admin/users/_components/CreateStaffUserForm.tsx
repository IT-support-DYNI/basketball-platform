"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@/components/ui/Alert";

export default function CreateStaffUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"COACH" | "ADMIN">("COACH");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }

      setResult({ email: body.user.email, tempPassword: body.tempPassword });
      setEmail("");
      setName("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <Alert tone="success" className="p-5">
        <p className="font-semibold">Account created for {result.email}</p>
        <p className="mt-1 text-sm">Temporary password (relay this to them — it won't be shown again):</p>
        <code className="mt-2 block rounded-control border border-line bg-surface px-3 py-2 font-mono text-sm text-ink">
          {result.tempPassword}
        </code>
        <button type="button" onClick={() => setResult(null)} className="mt-3 text-sm font-semibold hover:underline">
          Add another
        </button>
      </Alert>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-court-500/30 transition hover:border-flame"
      >
        + Add Coach or Admin
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-card border border-line bg-surface p-5 space-y-4">
      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="radio" checked={role === "COACH"} onChange={() => setRole("COACH")} /> Coach
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="radio" checked={role === "ADMIN"} onChange={() => setRole("ADMIN")} /> Admin
        </label>
      </div>

      <input
        type="text"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
