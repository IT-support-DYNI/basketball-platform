"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { applyHighContrast, applyFontSize, type FontSize } from "./displayPrefs";

/**
 * No visible UI. Reconciles this device's contrast/font-size with what's
 * saved on the account, once per authenticated session — the "works across
 * devices" half of Settings > Display: a new device starts from whatever
 * this device's DisplayPrefsScript applied from localStorage (nothing, on a
 * first visit), then this brings it in line with the server shortly after.
 */
export default function DisplayPreferencesSync() {
  const { status } = useSession();
  const synced = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || synced.current) return;
    synced.current = true;

    fetch("/api/v1/account/display-preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then((prefs: { highContrast: boolean; fontSizePreference: FontSize } | null) => {
        if (!prefs) return;
        applyHighContrast(prefs.highContrast);
        applyFontSize(prefs.fontSizePreference);
      })
      .catch(() => {
        /* best-effort — this device just keeps whatever it already had */
      });
  }, [status]);

  return null;
}
