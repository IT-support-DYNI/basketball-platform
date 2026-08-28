/*
 * NextAuth config: email/password login, JWT-based sessions.
 * Emails are always compared lowercase — account creation
 * (see /api/users) normalizes them the same way before storing,
 * so this must match or a real account can fail to log in.
 *
 * The jwt callback re-reads the user's role/team scope from the
 * database on every request rather than caching it for the JWT's
 * lifetime. That's a deliberate simplicity-over-micro-optimization
 * choice for a small-scale MVP: it means a deactivated account or
 * a coach's changed team assignment takes effect on the user's very
 * next request instead of only after they log back in, which matters
 * more here than shaving one indexed query off each request.
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { getLockoutState, recordLoginAttempt } from "./login-throttle";
import { isMfaEnabled, verifyMfaChallenge } from "./mfa";
import { createAuthSession, touchAuthSession } from "./auth-sessions";

/** A valid bcrypt hash of a random string — compared against when no account
 *  exists, so a missing account and a wrong password take about the same time. */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO1kK1r1e5jGZ5g0m3l4vB2cQ8yQ8yQ8y";

/*
 * Vercel preview / branch deployments get a unique URL per push, so a fixed
 * NEXTAUTH_URL env var can't match them. When it isn't set explicitly (which is
 * the case we want for Preview — Production still sets it to the real domain),
 * derive it from the deployment's own URL. VERCEL_BRANCH_URL is the stable
 * per-branch alias; VERCEL_URL is the per-deployment fallback.
 */
if (!process.env.NEXTAUTH_URL) {
  const vercelHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    process.env.NEXTAUTH_URL = `https://${vercelHost}`;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        /** TOTP code or recovery code, only sent on the second step when the
         *  first attempt returned MFA_REQUIRED. */
        totp: { label: "Authentication code", type: "text" },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const forwarded = (req?.headers?.["x-forwarded-for"] as string | undefined) ?? "";
        const ip = forwarded.split(",")[0]?.trim() || null;

        // Brute-force lockout: once locked, stay locked until the window clears,
        // even if the password is now correct. Surfaced to the user by the
        // login page via GET /api/v1/auth/login-status.
        const lockout = await getLockoutState(email);
        if (lockout.locked) {
          await recordLoginAttempt(email, ip, false);
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const passwordIsValid = await verifyPassword(
          credentials.password,
          user?.passwordHash ?? DUMMY_HASH,
        );

        if (!user || !user.isActive || !user.passwordHash || !passwordIsValid) {
          await recordLoginAttempt(email, ip, false);
          return null;
        }

        // Multi-factor step-up. The password was correct; if this account has
        // MFA on, a valid code (TOTP or recovery) is also required.
        if (await isMfaEnabled(user.id)) {
          const code = (credentials.totp ?? "").trim();
          if (!code) {
            // Not a failed attempt — the user just hasn't done step 2 yet.
            throw new Error("MFA_REQUIRED");
          }
          if (!(await verifyMfaChallenge(user.id, code))) {
            await recordLoginAttempt(email, ip, false);
            throw new Error("MFA_INVALID");
          }
        }

        await recordLoginAttempt(email, ip, true);

        const userAgent = (req?.headers?.["user-agent"] as string | undefined) ?? null;
        const sessionToken = await createAuthSession(user.id, userAgent, ip);

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          sid: sessionToken,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    // The JWT is re-issued (rotated) at most once a day and expires after a
    // week of inactivity. Server-side revocation is handled by the AuthSession
    // check in the jwt callback — that's the "refresh-token rotation where
    // applicable" equivalent for a credentials + JWT setup (brief §4).
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, carry the device-session handle from authorize().
      if (user && "sid" in user && typeof user.sid === "string") {
        token.sid = user.sid;
      }

      if (!token.sub) {
        return token;
      }

      // Device-session revocation: if this session was revoked (from another
      // device, or on password reset), drop the caller on their next request.
      if (token.sid && !(await touchAuthSession(token.sid))) {
        token.isActive = false;
        return token;
      }

      const userId = Number(token.sub);

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          coachProfile: { select: { id: true } },
          staffAssignments: { select: { teamId: true } },
          playerProfile: {
            select: {
              id: true,
              teamId: true, // deprecated fallback
              registrationStatus: true,
              memberships: {
                where: { status: { notIn: ["FORMER", "INACTIVE"] } },
                orderBy: { updatedAt: "desc" },
                take: 1,
                select: { teamId: true },
              },
            },
          },
        },
      });

      if (!dbUser) {
        // Account was deleted after the token was issued.
        token.isActive = false;
        return token;
      }

      token.id = dbUser.id.toString();
      token.role = dbUser.role;
      token.isActive = dbUser.isActive;
      token.mustChangePassword = dbUser.mustChangePassword;
      token.emailVerified = dbUser.emailVerifiedAt != null;
      token.coachProfileId = dbUser.coachProfile?.id;
      // Team scope comes from StaffAssignment (players) / active TeamMembership
      // (players). The deprecated PlayerProfile.teamId is a fallback only.
      token.teamIds = dbUser.staffAssignments.length
        ? [...new Set(dbUser.staffAssignments.map((a) => a.teamId))]
        : undefined;
      token.playerId = dbUser.playerProfile?.id;
      token.teamId =
        dbUser.playerProfile?.memberships[0]?.teamId ?? dbUser.playerProfile?.teamId ?? undefined;
      // Only PlayerProfile carries this — Admin/Coach/Guardian accounts have
      // no gate here (Guardian's own dashboard is a later increment; the
      // gate that matters today is on the linked child's PlayerProfile).
      token.registrationStatus = dbUser.playerProfile?.registrationStatus ?? undefined;

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
        session.user.coachProfileId = token.coachProfileId;
        session.user.teamIds = token.teamIds;
        session.user.playerId = token.playerId;
        session.user.teamId = token.teamId;
        session.user.mustChangePassword = token.mustChangePassword;
        session.user.emailVerified = token.emailVerified;
        session.user.sid = token.sid;
        session.user.registrationStatus = token.registrationStatus;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
