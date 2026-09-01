import { describe, it, expect } from "vitest";

import { CONSENT_TYPE_LABEL } from "./consent";

// consentStatusFor / outstandingConsents / resolveConsentSubject touch the DB
// and are covered by the browser-driven checks. This keeps the pure surface
// (labels + the enum→label map) honest.
describe("CONSENT_TYPE_LABEL", () => {
  it("labels every document type", () => {
    const types = [
      "CODE_OF_CONDUCT",
      "PRIVACY_NOTICE",
      "MEDIA_CONSENT",
      "MEDICAL_CONSENT",
      "DATA_PROCESSING",
      "TRIP_CONSENT",
      "OTHER",
    ] as const;
    for (const t of types) {
      expect(CONSENT_TYPE_LABEL[t]).toBeTruthy();
      expect(CONSENT_TYPE_LABEL[t]).not.toBe(t);
    }
  });
});
