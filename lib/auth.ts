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
import bcrypt from "bcryptjs";

import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user || !user.passwordHash || !user.isActive) {
          return null;
        }

        const passwordIsValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordIsValid) {
          return null;
        }

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
        session.user.registrationStatus = token.registrationStatus;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
