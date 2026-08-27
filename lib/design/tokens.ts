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
  /** Primary flame — the "BLAZERS" wordmark and the ball in the logo. */
  flame: "#f04800",
  /** Brighter amber-orange from the mid-flame; used for gradients and hover. */
  ember: "#f5851f",
  /** Gold from the flame tips; sparingly, for "live" / highlight states. */
  gold: "#f5c451",
  /** Near-black from the logo outline. */
  black: "#0b0b0f",
  /** Off-white from the logo lettering. */
  white: "#f4f1ec",
} as const;

export const dark = {
  ground: "#0b0b0f",
  surface: "#141419",
  surface2: "#1c1c23",
  surface3: "#26262f",
  ink: "#f4f1ec",
  inkDim: "#9b9ba6",
  inkFaint: "#6b6b77",
  line: "rgba(255,255,255,0.09)",
  lineStrong: "rgba(255,255,255,0.16)",
  flame: "#f04800",
  flameInk: "#ff7a3d",
  ember: "#f5851f",
  gold: "#f5c451",
  onFlame: "#ffffff",
  success: "#35c15e",
  warning: "#e0a417",
  danger: "#f0503c",
  info: "#5b9bf0",
} as const;

export const light = {
  ground: "#f7f4ef",
  surface: "#ffffff",
  surface2: "#f2eee7",
  surface3: "#e9e3d9",
  ink: "#18171c",
  inkDim: "#57545e",
  inkFaint: "#8a8792",
  line: "rgba(20,16,12,0.12)",
  lineStrong: "rgba(20,16,12,0.22)",
  flame: "#d63e00",
  flameInk: "#bf3900",
  ember: "#c4670b",
  gold: "#a9761a",
  onFlame: "#ffffff",
  success: "#1b923f",
  warning: "#b4790a",
  danger: "#ce3b2a",
  info: "#2f6fd0",
} as const;

/** Player / event status colours — deliberately distinct from the semantic set
 *  above so "injured red" never reads as "error red". Keys match the DB enums. */
export const statusColor = {
  // player status
  ACTIVE: "#35c15e",
  PENDING: "#e0a417",
  INJURED: "#f0503c",
  SUSPENDED: "#8b8177",
  INACTIVE: "#6b6b77",
  TRIALIST: "#5b9bf0",
  FORMER: "#6b6b77",
  // event / session status
  SCHEDULED: "#5b9bf0",
  CONFIRMED: "#35c15e",
  COMPLETED: "#35c15e",
  CANCELLED: "#f0503c",
  POSTPONED: "#e0a417",
  // attendance
  PRESENT: "#35c15e",
  ABSENT: "#f0503c",
  LATE: "#e0a417",
  EXCUSED: "#9b9ba6",
  // registration
  APPROVED: "#35c15e",
  REJECTED: "#f0503c",
  CHANGES_REQUESTED: "#5b9bf0",
} as const;

export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64, 80] as const;

export const radius = {
  control: 8,
  card: 12,
  lg: 16,
  pill: 9999,
} as const;

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
