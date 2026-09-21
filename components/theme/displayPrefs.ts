export type FontSize = "SMALL" | "MEDIUM" | "LARGE" | "XLARGE";

/** DB enum value -> the short token used in localStorage and the
 *  `data-font-size` attribute (kept short since it's read by a blocking
 *  pre-paint script — see DisplayPrefsScript). */
export const FONT_SIZE_ATTR: Record<FontSize, string> = {
  SMALL: "sm",
  MEDIUM: "md",
  LARGE: "lg",
  XLARGE: "xl",
};

/** Applies instantly to this device (attribute + localStorage cache); callers
 *  are responsible for also persisting to the server if it should follow the
 *  user across devices. */
export function applyHighContrast(on: boolean) {
  document.documentElement.setAttribute("data-contrast", on ? "high" : "normal");
  try {
    localStorage.setItem("dyni-contrast", on ? "1" : "0");
  } catch {
    /* private mode — the setting still applies for this session */
  }
}

export function applyFontSize(size: FontSize) {
  const attr = FONT_SIZE_ATTR[size];
  document.documentElement.setAttribute("data-font-size", attr);
  try {
    localStorage.setItem("dyni-font-size", attr);
  } catch {
    /* private mode — the setting still applies for this session */
  }
}
