import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const WORDS = [
  "hoop", "court", "swish", "layup", "press", "guard", "block", "screen",
  "pivot", "drive", "arena", "coach", "sprint", "dunk", "bench", "rally",
];

/** Human-relayable temp password (ARCHITECTURE.md §6.1) — readable over a phone call, still high entropy. */
export function generateTempPassword(): string {
  const word = WORDS[randomInt(WORDS.length)];
  const number = randomInt(1000, 9999);
  return `${word}-${number}-${WORDS[randomInt(WORDS.length)]}`;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
