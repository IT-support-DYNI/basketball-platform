"use client";

import { useState } from "react";
import { useReveal } from "./useReveal";

/**
 * Unlike RegisterInterestForm this one really does submit — there's no
 * follow-on flow to hand off to, so it posts straight to the API and shows
 * a real confirmation (or a real error) rather than pretending either way.
 */
export default function SafeguardingConcernForm() {
  const { ref, className, style } = useReveal(80);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value.trim();
    if (description.length < 10) {
      form.reportValidity();
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/v1/safeguarding-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: (form.elements.namedItem("name") as HTMLInputElement).value.trim() || undefined,
          reporterEmail: (form.elements.namedItem("email") as HTMLInputElement).value.trim() || undefined,
          relationship: (form.elements.namedItem("relationship") as HTMLInputElement).value.trim() || undefined,
          concernAbout: (form.elements.namedItem("about") as HTMLInputElement).value.trim() || undefined,
          description,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong sending this — please try again.");
        setStatus("error");
        return;
      }
      form.reset();
      setStatus("sent");
    } catch {
      setError("Something went wrong sending this — please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className={`reg-form ${className}`} style={style} ref={ref as React.Ref<HTMLDivElement>}>
        <p className="reg-ok">Report received</p>
        <p style={{ marginTop: 8, color: "var(--text-2)", fontSize: "var(--type-small)" }}>
          Thank you for telling us. This has gone straight to the club&apos;s safeguarding lead and no one else. If you
          left an email address and this needs following up, someone will be in touch.
        </p>
      </div>
    );
  }

  return (
    <form
      className={`reg-form ${className}`}
      style={style}
      ref={ref as React.Ref<HTMLFormElement>}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="field">
        <label htmlFor="sg-name">Your name (optional)</label>
        <input id="sg-name" name="name" type="text" placeholder="Leave blank to stay anonymous" />
      </div>
      <div className="field">
        <label htmlFor="sg-email">Your email (optional)</label>
        <input id="sg-email" name="email" type="email" placeholder="Only if you want us to follow up" />
      </div>
      <div className="field">
        <label htmlFor="sg-relationship">Your connection to the club (optional)</label>
        <input id="sg-relationship" name="relationship" type="text" placeholder="Player, guardian, coach…" />
      </div>
      <div className="field">
        <label htmlFor="sg-about">Who or what this is about (optional)</label>
        <input id="sg-about" name="about" type="text" placeholder="A name, a team, a session — whatever's relevant" />
      </div>
      <div className="field">
        <label htmlFor="sg-description">What happened</label>
        <textarea
          id="sg-description"
          name="description"
          rows={5}
          required
          minLength={10}
          placeholder="Tell us what happened, when, and who was involved if you know."
        />
      </div>
      {status === "error" && (
        <p style={{ color: "var(--danger, #b42318)", fontSize: "var(--type-small)" }}>{error}</p>
      )}
      <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Submit report"}
      </button>
      <small>
        This goes straight to the club&apos;s admin team, not to any coach or player. You can report anonymously — only
        the description is required.
      </small>
    </form>
  );
}
