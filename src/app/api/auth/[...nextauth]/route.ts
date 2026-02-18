export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      isAdmin?: boolean;
      isBanned?: boolean;
    }
  }

  interface User {
    role?: string;
    isAdmin?: boolean;
    isBanned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    isAdmin?: boolean;
    isBanned?: boolean;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user: nextAuthUser, account }) {
      if (account?.provider === "google" && nextAuthUser?.email) {
        let dbUser = await prisma.user.findFirst({ where: { email: nextAuthUser.email! } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: nextAuthUser.email!,
              name: nextAuthUser.name ?? undefined,
              role: "",
              phone: "",
              password: "",
            },
          });
        }
        await createSession({
          id: dbUser.id,
          email: dbUser.email ?? undefined,
          phone: dbUser.phone ?? undefined,
          role: dbUser.role ?? "",
          name: dbUser.name,
          isAdmin: dbUser.isAdmin,
          isBanned: dbUser.isBanned,
          studentId: undefined,
          shopOwnerId: undefined,
          shopId: undefined,
          collegeId: undefined,
        });
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      // Persist role from database to JWT token
      if (user) {
        token.role = user.role;
        token.isAdmin = user.isAdmin;
        token.isBanned = user.isBanned;
      }
      return token;
    },
    async session({ session, token }) {
      // Sync role from JWT token to session object
      if (token && session.user) {
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
        session.user.isBanned = token.isBanned;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Use NEXTAUTH_URL for production environment
      const productionUrl = process.env.NEXTAUTH_URL || "https://campus-store-online.vercel.app";
      if (url.startsWith("/")) return `${productionUrl}${url}`;
      if (new URL(url).origin === productionUrl) return url;
      return productionUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET,
});

export { handler as GET, handler as POST };
