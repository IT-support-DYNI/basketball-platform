"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

/** Requests a fresh email-verification link for the signed-in user. */
export default function ResendVerificationButton() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function resend() {
    setState("sending");
    try {
      await fetch("/api/v1/auth/resend-verification", { method: "POST" });
    } finally {
      setState("sent");
    }
  }

  if (state === "sent") {
    return <p className="text-sm text-success">Sent — check your inbox for the new link.</p>;
  }

  return (
    <Button variant="secondary" size="sm" loading={state === "sending"} onClick={resend}>
      Resend confirmation email
    </Button>
  );
}
