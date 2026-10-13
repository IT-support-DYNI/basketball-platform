/** Where each role lands after sign-in, or when it opens "/". No imports, so
 *  it's safe in middleware (Edge runtime) as well as server components. */
export const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  COACH: "/coach/dashboard",
  PLAYER: "/player/dashboard",
  GUARDIAN: "/guardian",
};
