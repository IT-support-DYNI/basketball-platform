import type { MailMessage } from "./port";

const CLUB = "DYNI Blazers";

function shell(bodyLines: string[]): string {
  return [`${CLUB}`, "", ...bodyLines, "", "—", `${CLUB} club platform`].join("\n");
}

export function verifyEmailMessage(to: string, name: string, url: string): MailMessage {
  return {
    to,
    subject: `Confirm your email — ${CLUB}`,
    text: shell([
      `Hi ${name},`,
      "",
      "Confirm your email address to finish registering with the club:",
      "",
      url,
      "",
      "This link expires in 24 hours. If you didn't start a registration, you can ignore this email.",
    ]),
  };
}

export function passwordResetMessage(to: string, name: string, url: string): MailMessage {
  return {
    to,
    subject: `Reset your password — ${CLUB}`,
    text: shell([
      `Hi ${name},`,
      "",
      "Someone asked to reset the password for this account. If it was you, set a new one here:",
      "",
      url,
      "",
      "This link expires in 30 minutes and can only be used once. If it wasn't you, ignore this email — your password hasn't changed.",
    ]),
  };
}
