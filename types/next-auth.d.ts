import { DefaultSession } from "next-auth";
import { UserRole, RegistrationStatus } from "@prisma/client";

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
      emailVerified?: boolean;
      /** The current device-session handle (AuthSession.tokenId). */
      sid?: string;
      coachProfileId?: number;
      teamIds?: number[];
      playerId?: number;
      teamId?: number | null;
      /// Only meaningful for role PLAYER — undefined for Admin/Coach/Guardian.
      registrationStatus?: RegistrationStatus;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    /** Device-session handle, set by authorize() and read once in the jwt callback. */
    sid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isActive: boolean;
    mustChangePassword: boolean;
    emailVerified?: boolean;
    sid?: string;
    coachProfileId?: number;
    teamIds?: number[];
    playerId?: number;
    teamId?: number | null;
    registrationStatus?: RegistrationStatus;
  }
}
