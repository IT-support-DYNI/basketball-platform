"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import Alert from "@/components/ui/Alert";

export default function SetPasswordPage() {
  const router = useRouter();
  const { update } = useSession();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong saving your password.");
        return;
      }

      await update();
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set your password"
      subtitle="You signed in with a temporary password. Choose your own before continuing."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <TextField
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? "Saving" : "Save and continue"}
        </Button>
      </form>
    </AuthShell>
  );
}
