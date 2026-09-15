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

/** Deliberately a brief notice, not the report content — same reasoning as
 *  the in-app notification this pairs with (see the safeguarding reports
 *  route): a safeguarding concern's details belong behind the admin
 *  console's access control, not sitting in an inbox as a second,
 *  unaudited copy. `to` is the club's safeguarding contact, not a user
 *  account, so there's no name to greet by. */
export function safeguardingReportSubmittedMessage(to: string, url: string, concernAbout: string | null): MailMessage {
  return {
    to,
    subject: `New safeguarding report — ${CLUB}`,
    text: shell([
      concernAbout ? `A new safeguarding concern was submitted, about ${concernAbout}.` : "A new safeguarding concern was submitted.",
      "",
      "Review it here (sign in as an administrator):",
      "",
      url,
    ]),
  };
}
