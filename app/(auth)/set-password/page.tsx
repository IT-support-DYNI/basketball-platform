"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import AuthShell from "@/components/shared/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import Alert from "@/components/ui/Alert";

export default function SetPasswordPage() {
  const router = useRouter();
  const { data, update } = useSession();
  // Forced change after a temporary password: no current password to ask for.
  // A voluntary change must prove the current one (the API enforces it too).
  const forced = data?.user.mustChangePassword ?? true;

  const [currentPassword, setCurrentPassword] = useState("");
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
        body: JSON.stringify(forced ? { newPassword } : { newPassword, currentPassword }),
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
      title={forced ? "Set your password" : "Change your password"}
      subtitle={
        forced
          ? "You signed in with a temporary password. Choose your own before continuing."
          : "Confirm your current password, then choose a new one. Your other devices will be signed out."
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!forced && (
          <TextField
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        )}
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
