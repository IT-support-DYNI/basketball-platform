/**
 * DYNI Blazers design tokens — canonical values.
 *
 * These mirror the CSS custom properties defined in `app/globals.css`. The CSS
 * is what the running app actually consumes (via Tailwind utilities that resolve
 * to `var(--token)`); this file exists so tokens can be referenced from TypeScript
 * (e.g. chart colours, canvas drawing, generated OG images) without re-typing hex
 * codes, and so there is one documented place describing the system.
 *
 * Brand colours are sampled from the club logo (`public/brand/`). If the club
 * later supplies an official brand pack, change the values here and in
 * `globals.css` — nothing else in the app hard-codes them.
 */

export const brand = {
  /** Primary accent — same #FE440B used on the public /club site. One
   *  brand colour, one app (was sampled from the logo separately before
   *  the Sept 2026 wireframe pass unified the two). */
  flame: "#fe440b",
  /** Brighter amber-orange variant; used for gradients and hover. */
  ember: "#ff6b3d",
  /** Gold; sparingly, for "live" / highlight states. */
  gold: "#d97706",
  /** Near-black ink. */
  black: "#171310",
  /** Cream paper. */
  white: "#f6f4ef",
} as const;

export const dark = {
  // Sept 2026 wireframe pass — see app/globals.css for the same values as
  // the canonical CSS custom properties this mirrors.
  ground: "#1c1915",
  surface: "#262220",
  surface2: "#362f2a",
  surface3: "#4a443c",
  ink: "#f1ede4",
  inkDim: "#c9c3b6",
  inkFaint: "#8f897c",
  line: "rgba(241,237,228,0.3)",
  lineStrong: "rgba(241,237,228,0.45)",
  flame: "#fe440b",
  flameInk: "#ff8156",
  ember: "#ff8156",
  gold: "#fbbf24",
  onFlame: "#171310",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#5b8cff",
} as const;

export const light = {
  ground: "#f6f4ef",
  surface: "#ffffff",
  surface2: "#ece8df",
  surface3: "#dfd9cc",
  ink: "#2a2723",
  inkDim: "#514c44",
  inkFaint: "#8b857a",
  line: "#a39d92",
  lineStrong: "#8b857a",
  flame: "#fe440b",
  flameInk: "#ff6b3d",
  ember: "#ff6b3d",
  gold: "#d97706",
  onFlame: "#171310",
  success: "#027a48",
  warning: "#b4790a",
  danger: "#b42318",
  info: "#2f6fd0",
} as const;

/** Player / event status colours — deliberately distinct from the semantic set
 *  above so "injured red" never reads as "error red". Keys match the DB enums. */
export const statusColor = {
  // player status
  ACTIVE: "#4ade80",
  PENDING: "#fbbf24",
  INJURED: "#f0503c",
  SUSPENDED: "#8b8177",
  INACTIVE: "#646e82",
  TRIALIST: "#5b8cff",
  FORMER: "#646e82",
  // event / session status
  SCHEDULED: "#5b8cff",
  CONFIRMED: "#4ade80",
  COMPLETED: "#4ade80",
  CANCELLED: "#f0503c",
  POSTPONED: "#fbbf24",
  // attendance
  PRESENT: "#4ade80",
  ABSENT: "#f0503c",
  LATE: "#fbbf24",
  EXCUSED: "#94a3b8",
  // registration
  APPROVED: "#4ade80",
  REJECTED: "#f0503c",
  CHANGES_REQUESTED: "#5b8cff",
} as const;

export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64, 80] as const;

export const radius = {
  control: 4,
  card: 6,
  lg: 8,
  pill: 9999,
} as const;

/** var(--font-archivo) now holds Architects Daughter (handwritten display),
 *  var(--font-barlow) holds Big Shoulders Display (condensed/bold, stat-card
 *  contexts), and var(--font-inter) holds IBM Plex Mono (body) — see the
 *  comment in app/layout.tsx for why the variable names weren't renamed. */
export const font = {
  display: "var(--font-archivo)",
  body: "var(--font-inter)",
  condensed: "var(--font-barlow)",
  mono: "var(--font-plex-mono)",
} as const;

export const motion = {
  fast: "120ms",
  base: "200ms",
  slow: "320ms",
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;
