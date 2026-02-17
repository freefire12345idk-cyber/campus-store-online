export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

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
              role: null,
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET,
});

export { handler as GET, handler as POST };
