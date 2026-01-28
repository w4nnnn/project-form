import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens,
  }) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan password diperlukan");
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.username),
          with: {
            subRole: true,
          },
        });

        if (!user) {
          throw new Error("Username tidak ditemukan");
        }

        if (!user.password) {
          throw new Error("Akun ini tidak memiliki password");
        }

        if (!user.isActive) {
          throw new Error("Akun tidak aktif");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        return {
          id: user.id,
          username: user.email,
          email: user.email,
          name: user.name,
          role: user.role,
          subRoleId: user.subRoleId,
          subRoleName: user.subRole?.name || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username ?? user.email;
        token.role = user.role;
        token.subRoleId = user.subRoleId;
        token.subRoleName = user.subRoleName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.subRoleId = token.subRoleId as string | null;
        session.user.subRoleName = token.subRoleName as string | null;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
