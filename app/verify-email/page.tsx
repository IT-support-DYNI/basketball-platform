"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import AuthShell from "@/components/auth/AuthShell";
import { ButtonLink } from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

function VerifyEmail() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setState("error");
      setMessage("This link is missing its token.");
      return;
    }

    fetch("/api/v1/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          setState("ok");
          setMessage(body.message ?? "Your email address is confirmed.");
        } else {
          setState("error");
          setMessage(body.error ?? "This link is invalid or has expired.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Something went wrong. Try the link again in a moment.");
      });
  }, [token]);

  return (
    <div className="flex flex-col gap-4">
      {state === "working" && <p className="text-sm text-ink-dim">Confirming your email…</p>}
      {state === "ok" && (
        <>
          <Alert tone="success">{message}</Alert>
          <ButtonLink href="/login" fullWidth>
            Continue to sign in
          </ButtonLink>
        </>
      )}
      {state === "error" && (
        <>
          <Alert tone="danger">{message}</Alert>
          <p className="text-sm text-ink-dim">
            Sign in and use the &ldquo;resend&rdquo; button on your status page to get a fresh link.
          </p>
          <ButtonLink href="/login" variant="secondary" fullWidth>
            Go to sign in
          </ButtonLink>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Confirm your email">
      <Suspense fallback={null}>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
