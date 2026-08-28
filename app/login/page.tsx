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
  const [totp, setTotp] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        totp: needsMfa ? totp : undefined,
        redirect: false,
      });

      if (result && !result.error) {
        router.push("/");
        router.refresh();
        return;
      }

      const code = result?.error ?? "";

      if (code === "MFA_REQUIRED") {
        setNeedsMfa(true);
        setError("");
        return;
      }
      if (code === "MFA_INVALID") {
        setNeedsMfa(true);
        setError("That authentication code didn't match. Try the current one from your app.");
        return;
      }

      // Distinguish a lockout from a bad password (NextAuth won't carry that
      // detail through, so ask the status endpoint).
      try {
        const status = await fetch(
          `/api/v1/auth/login-status?email=${encodeURIComponent(email)}`,
        ).then((r) => r.json());
        if (status?.locked) {
          setError(
            `Too many sign-in attempts. Try again in about ${status.retryAfterMinutes} minute${
              status.retryAfterMinutes === 1 ? "" : "s"
            }.`,
          );
          return;
        }
      } catch {
        /* fall through to the generic message */
      }
      setError("That email and password don't match. Check them and try again.");
      setNeedsMfa(false);
    } catch {
      setError("Something went wrong signing you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={needsMfa ? "Authentication code" : "Club sign in"}
      subtitle={needsMfa ? "Enter the 6-digit code from your authenticator app." : "Members and staff only."}
      footer={
        needsMfa ? (
          <button
            type="button"
            onClick={() => {
              setNeedsMfa(false);
              setTotp("");
              setError("");
            }}
            className="font-semibold text-flame-ink hover:underline"
          >
            Start over
          </button>
        ) : (
          <>
            New player or parent?{" "}
            <Link href="/register" className="font-semibold text-flame-ink hover:underline">
              Start registration
            </Link>
            <span className="mt-1 block text-xs text-ink-faint">
              An administrator reviews every registration before full access is granted.
            </span>
          </>
        )
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!needsMfa && (
          <>
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
          </>
        )}

        {needsMfa && (
          <TextField
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            required
            autoFocus
            placeholder="123456"
            hint="Or enter one of your recovery codes."
          />
        )}

        {error && <Alert tone="danger">{error}</Alert>}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? "Signing in" : needsMfa ? "Verify" : "Sign in"}
        </Button>

        {!needsMfa && (
          <p className="text-center text-xs text-ink-faint">
            <Link href="/forgot-password" className="font-semibold text-flame-ink hover:underline">
              Forgot your password?
            </Link>
          </p>
        )}
      </form>
    </AuthShell>
  );
}
