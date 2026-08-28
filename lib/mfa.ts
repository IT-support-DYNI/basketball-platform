import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "./prisma";
import { verifyTotp } from "./totp";

/**
 * TOTP multi-factor auth. Enrollment is voluntary for everyone and strongly
 * recommended for administrators (Doc 6 §19.5). Recovery codes are stored as
 * bcrypt hashes and consumed one-per-use.
 */

const RECOVERY_CODE_COUNT = 10;

export function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = randomBytes(5).toString("hex").toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
  });
}

export function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(normaliseCode(code), 10)));
}

function normaliseCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

export async function isMfaEnabled(userId: number): Promise<boolean> {
  const mfa = await prisma.userMfa.findUnique({ where: { userId }, select: { enabledAt: true } });
  return mfa?.enabledAt != null;
}

/**
 * Verify a login challenge: a 6-digit TOTP code, or a one-time recovery code
 * (which is then consumed). Returns true on success.
 */
export async function verifyMfaChallenge(userId: number, input: string): Promise<boolean> {
  const mfa = await prisma.userMfa.findUnique({ where: { userId } });
  if (!mfa?.enabledAt) return false;

  const cleaned = normaliseCode(input);

  if (/^\d{6}$/.test(cleaned) && verifyTotp(cleaned, mfa.secret)) return true;

  for (const hash of mfa.recoveryCodes) {
    if (await bcrypt.compare(cleaned, hash)) {
      await prisma.userMfa.update({
        where: { userId },
        data: { recoveryCodes: mfa.recoveryCodes.filter((h) => h !== hash) },
      });
      return true;
    }
  }

  return false;
}
