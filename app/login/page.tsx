"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import Alert from "@/components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (!result || result.error) {
        setError("That email and password don't match. Check them and try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong signing you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Club sign in"
      subtitle="Members and staff only."
      footer={
        <>
          New player or parent?{" "}
          <Link href="/register" className="font-semibold text-flame-ink hover:underline">
            Start registration
          </Link>
          <span className="mt-1 block text-xs text-ink-faint">
            An administrator reviews every registration before full access is granted.
          </span>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Your password"
        />

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? "Signing in" : "Sign in"}
        </Button>

        <p className="text-center text-xs text-ink-faint">
          Forgot your password? Ask your club administrator to send a reset link.
        </p>
      </form>
    </AuthShell>
  );
}
