import type { MailPort, MailMessage } from "./port";

/**
 * Real transactional email via Resend's HTTP API — no SDK dependency, this is
 * a single JSON POST. Needs RESEND_API_KEY and MAIL_FROM (see .env.example);
 * MAIL_FROM's domain has to be verified in the Resend dashboard, or Resend
 * rejects the send — its sandbox sender (onboarding@resend.dev) only reaches
 * the Resend account's own email, not real users.
 */
export class ResendMailAdapter implements MailPort {
  async send(message: MailMessage): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;
    if (!apiKey || !from) {
      throw new Error("RESEND_API_KEY and MAIL_FROM must both be set to use MAIL_TRANSPORT=resend.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Resend API returned ${res.status}: ${body}`);
    }
  }
}
