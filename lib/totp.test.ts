import { describe, it, expect } from "vitest";

import { generateSecret, totpAt, verifyTotp, totpAuthUri } from "./totp";

// RFC 6238 test vector: ASCII secret "12345678901234567890" as base32.
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("totp — RFC 6238 vectors (SHA-1, 6 digits)", () => {
  it("matches known codes at known timestamps", () => {
    expect(totpAt(RFC_SECRET, 59)).toBe("287082");
    expect(totpAt(RFC_SECRET, 1111111109)).toBe("081804");
    expect(totpAt(RFC_SECRET, 1111111111)).toBe("050471");
    expect(totpAt(RFC_SECRET, 1234567890)).toBe("005924");
    expect(totpAt(RFC_SECRET, 2000000000)).toBe("279037");
  });
});

describe("verifyTotp", () => {
  it("accepts the current code and rejects a wrong one", () => {
    const secret = generateSecret();
    const now = Math.floor(Date.now() / 1000);
    expect(verifyTotp(totpAt(secret, now), secret)).toBe(true);
    expect(verifyTotp("000000", secret)).toBe(false);
    expect(verifyTotp("12345", secret)).toBe(false);
    expect(verifyTotp("notanumber", secret)).toBe(false);
  });

  it("tolerates one period of clock skew, not two", () => {
    const secret = generateSecret();
    const now = Math.floor(Date.now() / 1000);
    expect(verifyTotp(totpAt(secret, now - 30), secret)).toBe(true);
    expect(verifyTotp(totpAt(secret, now + 30), secret)).toBe(true);
    expect(verifyTotp(totpAt(secret, now - 90), secret)).toBe(false);
  });

  it("ignores spaces/dashes a user might type", () => {
    const secret = generateSecret();
    const code = totpAt(secret, Math.floor(Date.now() / 1000));
    expect(verifyTotp(`${code.slice(0, 3)} ${code.slice(3)}`, secret)).toBe(true);
  });
});

describe("totpAuthUri", () => {
  it("builds a scannable otpauth URI", () => {
    const uri = totpAuthUri("ABCDEF", "coach@example.com");
    expect(uri).toMatch(/^otpauth:\/\/totp\/DYNI%20Blazers:coach%40example.com\?/);
    expect(uri).toContain("secret=ABCDEF");
    expect(uri).toContain("issuer=DYNI+Blazers");
  });
});
