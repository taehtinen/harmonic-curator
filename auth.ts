import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginAttemptResult, UserStatus } from "@prisma/client";

import { recordLoginAttempt } from "@/lib/login-attempt";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const username =
          typeof credentials?.username === "string" ? credentials.username.trim() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
          await recordLoginAttempt({
            username,
            userId: null,
            result: LoginAttemptResult.UNKNOWN_USER,
          });
          return null;
        }
        if (!user.passwordHash) {
          await recordLoginAttempt({
            username,
            userId: user.id,
            result: LoginAttemptResult.NO_PASSWORD_SET,
          });
          return null;
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          await recordLoginAttempt({
            username,
            userId: user.id,
            result: LoginAttemptResult.INVALID_PASSWORD,
          });
          return null;
        }

        await recordLoginAttempt({
          username,
          userId: user.id,
          result: LoginAttemptResult.SUCCESS,
        });

        return {
          id: user.id.toString(),
          name: user.username,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && "status" in user) {
        token.sub = user.id;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.status =
          token.status === UserStatus.ADMIN ? UserStatus.ADMIN : UserStatus.USER;
      }
      return session;
    },
  },
});
