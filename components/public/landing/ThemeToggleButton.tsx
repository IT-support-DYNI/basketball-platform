"use client";

/** Theme toggle styled for the landing page's own `.toggle` class — but the
 *  underlying mechanism (the `dyni-theme` localStorage key, the `data-theme`
 *  attribute on <html>) is the exact same one components/theme/ThemeToggle.tsx
 *  and ThemeScript.tsx already use everywhere else in the app, so this page's
 *  toggle and the app's toggle stay in sync. Unlike ThemeToggle.tsx, both
 *  sun/moon icons are always in the DOM and the *CSS* swaps which one shows
 *  (styles/dyni-landing/landing.css's `.toggle .sun`/`.toggle .moon` rules,
 *  ported from the design's own approach) — so there's no hydration-mismatch
 *  risk from guessing the theme before mount. */
export default function ThemeToggleButton() {
  function toggle() {
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme");
    const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = (cur || (sysDark ? "dark" : "light")) === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("dyni-theme", next);
    } catch {
      /* private mode — the toggle still works for this session */
    }
  }

  return (
    <button className="toggle" type="button" onClick={toggle} aria-label="Switch theme">
      <svg className="sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2"></circle>
        <path d="M12 2.6v2.2m0 14.4v2.2M2.6 12h2.2m14.4 0h2.2M5.3 5.3l1.6 1.6m10.2 10.2 1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"></path>
      </svg>
      <svg className="moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4Z"></path>
      </svg>
    </button>
  );
}
