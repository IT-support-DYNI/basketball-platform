/**
 * Mail port — the interface every transport implements. The app only ever
 * depends on this, so swapping the console adapter for a real provider (Resend,
 * SMTP, SES) later is a one-file change, no call-site edits.
 */

export type MailMessage = {
  to: string;
  subject: string;
  /** Plain-text body — always required (accessibility + deliverability). */
  text: string;
  /** Optional HTML body. */
  html?: string;
};

export interface MailPort {
  send(message: MailMessage): Promise<void>;
}
