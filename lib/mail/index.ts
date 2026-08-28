import type { MailMessage, MailPort } from "./port";
import { ConsoleMailAdapter } from "./console-adapter";

/**
 * Chooses the mail transport from `MAIL_TRANSPORT`:
 *   - "console" (default) — logs to the server console (dev / preview / free tier)
 *   - future: "resend" | "smtp" | "ses" — add the adapter and a case here only
 *
 * `sendMail` never throws to the caller: a failed transactional email should not
 * fail the request that triggered it (registration, password reset). It logs and
 * returns; the user always has a "resend" path in the UI.
 */
function makeTransport(): MailPort {
  switch (process.env.MAIL_TRANSPORT) {
    case "console":
    case undefined:
    case "":
      return new ConsoleMailAdapter();
    default:
      console.warn(`[mail] unknown MAIL_TRANSPORT "${process.env.MAIL_TRANSPORT}", using console`);
      return new ConsoleMailAdapter();
  }
}

const transport = makeTransport();

export async function sendMail(message: MailMessage): Promise<void> {
  try {
    await transport.send(message);
  } catch (err) {
    console.error("[mail] failed to send", { to: message.to, subject: message.subject }, err);
  }
}

export type { MailMessage } from "./port";
