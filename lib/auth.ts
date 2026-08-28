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

        await recordLoginAttempt(email, ip, true);
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token }) {
      if (!token.sub) {
        return token;
      }

      const userId = Number(token.sub);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          coachProfile: {
            include: { teams: { select: { teamId: true } } },
          },
          playerProfile: {
            select: { id: true, teamId: true, registrationStatus: true },
          },
        },
      });

      if (!user) {
        // Account was deleted after the token was issued.
        token.isActive = false;
        return token;
      }

      token.id = user.id.toString();
      token.role = user.role;
      token.isActive = user.isActive;
      token.mustChangePassword = user.mustChangePassword;
      token.emailVerified = user.emailVerifiedAt != null;
      token.coachProfileId = user.coachProfile?.id;
      token.teamIds = user.coachProfile?.teams.map((t) => t.teamId) ?? undefined;
      token.playerId = user.playerProfile?.id;
      token.teamId = user.playerProfile?.teamId ?? undefined;
      // Only PlayerProfile carries this — Admin/Coach/Guardian accounts have
      // no gate here (Guardian's own dashboard is a later increment; the
      // gate that matters today is on the linked child's PlayerProfile).
      token.registrationStatus = user.playerProfile?.registrationStatus ?? undefined;

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
        session.user.registrationStatus = token.registrationStatus;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
