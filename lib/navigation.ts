/**
 * Declarative navigation.
 *
 * Instead of a hardcoded menu per role, every nav item declares the capability
 * it needs, and each role grants a set of capabilities. A user's menu is the
 * ordered list of items whose capability they hold — so someone who ends up
 * holding two roles (e.g. Coach + Welfare Officer, once the full role set lands
 * in W3) gets one merged, de-duplicated menu rather than two conflicting sets.
 *
 * Only routes that exist today are listed. New modules add their capability
 * here (and to the relevant roles) when they're built — components don't change.
 * Labels follow the DYNI brief §38.
 */

export type Capability =
  | "player.home"
  | "player.team"
  | "player.schedule"
  | "player.videos"
  | "player.performance"
  | "player.feedback"
  | "player.profile"
  | "coach.home"
  | "coach.team"
  | "coach.players"
  | "coach.training"
  | "coach.attendance"
  | "coach.videos"
  | "coach.performance"
  | "announcements"
  | "messages"
  | "admin.home"
  | "admin.registrations"
  | "admin.members"
  | "admin.teams"
  | "admin.coaches"
  | "admin.players"
  | "admin.training"
  | "admin.attendance"
  | "admin.performance"
  | "admin.seasons"
  | "admin.consent"
  | "admin.audit"
  | "admin.settings"
  | "guardian.home"
  | "account.security"
  | "account.data";

const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  PLAYER: [
    "player.home",
    "player.team",
    "player.schedule",
    "player.videos",
    "player.performance",
    "player.feedback",
    "player.profile",
    "announcements",
    "messages",
  "account.security",
    "account.data",
  ],
  COACH: [
    "coach.home",
    "coach.team",
    "coach.players",
    "coach.training",
    "coach.attendance",
    "coach.videos",
    "coach.performance",
    "announcements",
    "messages",
  "account.security",
    "account.data",
  ],
  ADMIN: [
    "admin.home",
    "admin.registrations",
    "admin.members",
    "admin.teams",
    "admin.coaches",
    "admin.players",
    "admin.training",
    "admin.attendance",
    "admin.performance",
    "admin.seasons",
    "admin.consent",
    "admin.audit",
    "announcements",
    "messages",
    "admin.settings",
  "account.security",
    "account.data",
  ],
  GUARDIAN: ["guardian.home", "announcements", "messages", "account.security", "account.data"],
};

export function capabilitiesFor(roles: string | string[]): Set<Capability> {
  const list = Array.isArray(roles) ? roles : [roles];
  const caps = new Set<Capability>();
  for (const role of list) {
    for (const cap of ROLE_CAPABILITIES[role] ?? []) caps.add(cap);
  }
  return caps;
}

/** Icon keys resolved to SVGs by `components/nav/NavIcon.tsx`. */
export type NavIconName =
  | "home"
  | "team"
  | "calendar"
  | "attendance"
  | "chart"
  | "feedback"
  | "video"
  | "users"
  | "whistle"
  | "megaphone"
  | "chat"
  | "history"
  | "season"
  | "settings"
  | "shield"
  | "inbox"
  | "user";

export type NavItem = {
  label: string;
  href: string;
  capability: Capability;
  icon: NavIconName;
  /** Surfaced in the mobile bottom bar (max 4 per role); the rest live behind "More". */
  primary?: boolean;
};

/** One flat, ordered list; the visible subset is whatever the caller can access. */
const NAV: NavItem[] = [
  { label: "Home", href: "/player/dashboard", capability: "player.home", icon: "home", primary: true },
  { label: "Dashboard", href: "/coach/dashboard", capability: "coach.home", icon: "home", primary: true },
  { label: "Dashboard", href: "/admin/dashboard", capability: "admin.home", icon: "home", primary: true },
  { label: "My children", href: "/guardian", capability: "guardian.home", icon: "team", primary: true },

  { label: "Registrations", href: "/admin/registrations", capability: "admin.registrations", icon: "inbox", primary: true },
  { label: "Members", href: "/admin/users", capability: "admin.members", icon: "users" },

  { label: "My Team", href: "/player/my-team", capability: "player.team", icon: "team", primary: true },
  { label: "Team", href: "/coach/my-teams", capability: "coach.team", icon: "team", primary: true },
  { label: "Teams", href: "/admin/teams", capability: "admin.teams", icon: "team", primary: true },
  { label: "Coaches", href: "/admin/coaches", capability: "admin.coaches", icon: "whistle" },
  { label: "Players", href: "/coach/players", capability: "coach.players", icon: "users" },
  { label: "Players", href: "/admin/players", capability: "admin.players", icon: "users", primary: true },

  { label: "Schedule", href: "/player/training", capability: "player.schedule", icon: "calendar", primary: true },
  { label: "Training", href: "/coach/training", capability: "coach.training", icon: "calendar", primary: true },
  { label: "Training", href: "/admin/training", capability: "admin.training", icon: "calendar" },

  { label: "Attendance", href: "/coach/attendance", capability: "coach.attendance", icon: "attendance", primary: true },
  { label: "Attendance", href: "/admin/attendance", capability: "admin.attendance", icon: "attendance" },

  { label: "Videos", href: "/player/videos", capability: "player.videos", icon: "video" },
  { label: "Videos", href: "/coach/videos", capability: "coach.videos", icon: "video" },

  { label: "Performance", href: "/player/performance", capability: "player.performance", icon: "chart", primary: true },
  { label: "Performance", href: "/coach/performance", capability: "coach.performance", icon: "chart" },
  { label: "Performance", href: "/admin/performance", capability: "admin.performance", icon: "chart" },
  { label: "Feedback", href: "/player/feedback", capability: "player.feedback", icon: "feedback" },

  { label: "Announcements", href: "/announcements", capability: "announcements", icon: "megaphone" },
  { label: "Messages", href: "/messages", capability: "messages", icon: "chat", primary: true },

  { label: "Seasons", href: "/admin/seasons", capability: "admin.seasons", icon: "season" },
  { label: "Consent", href: "/admin/consent", capability: "admin.consent", icon: "shield" },
  { label: "Audit log", href: "/admin/audit", capability: "admin.audit", icon: "history" },
  { label: "Settings", href: "/admin/settings", capability: "admin.settings", icon: "settings" },
  { label: "Profile", href: "/player/profile", capability: "player.profile", icon: "user" },
  { label: "Security", href: "/settings/security", capability: "account.security", icon: "shield" },
  { label: "Your data", href: "/settings/account", capability: "account.data", icon: "user" },
];

export function navFor(roles: string | string[]): NavItem[] {
  const caps = capabilitiesFor(roles);
  const seen = new Set<string>();
  const items: NavItem[] = [];
  for (const item of NAV) {
    if (!caps.has(item.capability) || seen.has(item.href)) continue;
    seen.add(item.href);
    items.push(item);
  }
  return items;
}

/**
 * The mobile bottom-bar destinations: the items flagged `primary` that the
 * caller can access, capped at 4 so the bar + a "More" tab stay on one row.
 * Everything else (including any primary items past the cap) stays in "More".
 */
export function primaryNavFor(roles: string | string[]): NavItem[] {
  return navFor(roles)
    .filter((item) => item.primary)
    .slice(0, 4);
}
