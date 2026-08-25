import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

/*
 * The session carries everything the RBAC helpers in
 * lib/authorization.ts need without an extra DB round trip:
 * a Coach's teamIds (every team they're assigned to) and a
 * Player's own playerId/teamId. See lib/auth.ts's jwt callback
 * for where these are populated.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isActive: boolean;
      mustChangePassword: boolean;
      coachProfileId?: number;
      teamIds?: number[];
      playerId?: number;
      teamId?: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isActive: boolean;
    mustChangePassword: boolean;
    coachProfileId?: number;
    teamIds?: number[];
    playerId?: number;
    teamId?: number | null;
  }
}
