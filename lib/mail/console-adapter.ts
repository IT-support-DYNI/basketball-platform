import type { MailPort, MailMessage } from "./port";

/**
 * Local-development transport: prints the message (and any link in it) to the
 * server console instead of sending anything. No email provider is configured
 * on the free tier — this is the dev + preview default. Production wires in a
 * real adapter via MAIL_TRANSPORT (see ./index.ts).
 */
export class ConsoleMailAdapter implements MailPort {
  async send(message: MailMessage): Promise<void> {
    const link = message.text.match(/https?:\/\/\S+/)?.[0];
    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "──────────────── ✉  DEV EMAIL (not actually sent) ────────────────",
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        link ? `Link:    ${link}` : null,
        "─────────────────────────────────────────────────────────────────",
        message.text,
        "─────────────────────────────────────────────────────────────────",
        "",
      ]
        .filter((l) => l !== null)
        .join("\n"),
    );
  }
}
