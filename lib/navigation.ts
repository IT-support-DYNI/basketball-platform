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
  | "coach.announcements"
  | "admin.home"
  | "admin.registrations"
  | "admin.members"
  | "admin.teams"
  | "admin.coaches"
  | "admin.players"
  | "admin.training"
  | "admin.attendance"
  | "admin.performance"
  | "admin.settings";

const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  PLAYER: [
    "player.home",
    "player.team",
    "player.schedule",
    "player.videos",
    "player.performance",
    "player.feedback",
    "player.profile",
  ],
  COACH: [
    "coach.home",
    "coach.team",
    "coach.players",
    "coach.training",
    "coach.attendance",
    "coach.videos",
    "coach.performance",
    "coach.announcements",
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
    "admin.settings",
  ],
};

export function capabilitiesFor(roles: string | string[]): Set<Capability> {
  const list = Array.isArray(roles) ? roles : [roles];
  const caps = new Set<Capability>();
  for (const role of list) {
    for (const cap of ROLE_CAPABILITIES[role] ?? []) caps.add(cap);
  }
  return caps;
}

export type NavItem = { label: string; href: string; capability: Capability };

/** One flat, ordered list; the visible subset is whatever the caller can access. */
const NAV: NavItem[] = [
  { label: "Home", href: "/player/dashboard", capability: "player.home" },
  { label: "Dashboard", href: "/coach/dashboard", capability: "coach.home" },
  { label: "Dashboard", href: "/admin/dashboard", capability: "admin.home" },

  { label: "Registrations", href: "/admin/registrations", capability: "admin.registrations" },
  { label: "Members", href: "/admin/users", capability: "admin.members" },

  { label: "My Team", href: "/player/my-team", capability: "player.team" },
  { label: "Team", href: "/coach/my-teams", capability: "coach.team" },
  { label: "Teams", href: "/admin/teams", capability: "admin.teams" },
  { label: "Coaches", href: "/admin/coaches", capability: "admin.coaches" },
  { label: "Players", href: "/coach/players", capability: "coach.players" },
  { label: "Players", href: "/admin/players", capability: "admin.players" },

  { label: "Schedule", href: "/player/training", capability: "player.schedule" },
  { label: "Training", href: "/coach/training", capability: "coach.training" },
  { label: "Training", href: "/admin/training", capability: "admin.training" },

  { label: "Attendance", href: "/coach/attendance", capability: "coach.attendance" },
  { label: "Attendance", href: "/admin/attendance", capability: "admin.attendance" },

  { label: "Videos", href: "/player/videos", capability: "player.videos" },
  { label: "Videos", href: "/coach/videos", capability: "coach.videos" },

  { label: "Performance", href: "/player/performance", capability: "player.performance" },
  { label: "Performance", href: "/coach/performance", capability: "coach.performance" },
  { label: "Performance", href: "/admin/performance", capability: "admin.performance" },
  { label: "Feedback", href: "/player/feedback", capability: "player.feedback" },

  { label: "Announcements", href: "/coach/announcements", capability: "coach.announcements" },

  { label: "Settings", href: "/admin/settings", capability: "admin.settings" },
  { label: "Profile", href: "/player/profile", capability: "player.profile" },
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
