import { createHmac, randomBytes } from "crypto";

/**
 * TOTP (RFC 6238) — hand-rolled on Node's `crypto` so there's no third-party
 * OTP dependency. SHA-1, 6 digits, 30-second period (what every authenticator
 * app defaults to).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIOD_SECONDS = 30;
const DIGITS = 6;

export function generateSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

export function totpAuthUri(secret: string, account: string, issuer = "DYNI Blazers"): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${params.toString()}`;
}

/** True if `token` is a valid code for `secret` now (±`window` periods for clock skew). */
export function verifyTotp(token: string, secret: string, window = 1): boolean {
  const cleaned = token.replace(/\D/g, "");
  if (cleaned.length !== DIGITS) return false;

  const counter = Math.floor(Date.now() / 1000 / PERIOD_SECONDS);
  let match = false;
  // Check every candidate (no early return) so timing doesn't reveal which step matched.
  for (let offset = -window; offset <= window; offset += 1) {
    if (constantTimeEquals(cleaned, hotp(secret, counter + offset))) match = true;
  }
  return match;
}

/** For unit tests / fixed-time verification. */
export function totpAt(secret: string, unixSeconds: number): string {
  return hotp(secret, Math.floor(unixSeconds / PERIOD_SECONDS));
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(Math.max(0, counter)));

  const digest = createHmac("sha1", key).update(counterBuf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
