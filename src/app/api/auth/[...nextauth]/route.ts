export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

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
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, phone, password } = credentials as any;
          const loginId = email?.trim() || phone?.trim();
          
          console.log("🔍 Attempting login for:", { email, phone, loginId });
          
          if (!loginId || !password) {
            console.log("❌ Missing loginId or password");
            return null;
          }
          
          const isEmail = String(loginId).includes("@");
          console.log("📧 Is email login:", isEmail);
          
          const user = await prisma.user.findFirst({
            where: isEmail ? { email: loginId } : { phone: loginId },
            include: { student: true, shopOwner: { include: { shop: true } } },
          });
          
          console.log("👤 User found in DB:", user ? {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isAdmin: user.isAdmin,
            hasPassword: !!user.password
          } : null);
          
          if (!user) {
            console.log("❌ User not found in database");
            return null;
          }
          if (!user.password) {
            console.log("❌ User has no password (likely Google account)");
            return null;
          }
          
          const isCorrectPassword = await verifyPassword(password, user.password);
          console.log("🔐 Password Match:", isCorrectPassword);
          
          if (!isCorrectPassword) {
            console.log("❌ Password verification failed");
            return null;
          }
          
          console.log("✅ Login successful, returning user object");
          return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            role: user.role,
            isAdmin: user.isAdmin,
            isBanned: user.isBanned,
            studentId: user.student?.id,
            shopOwnerId: user.shopOwner?.id,
            shopId: user.shopOwner?.shopId,
            collegeId: user.student?.collegeId,
          };
        } catch (error) {
          console.error("❌ Credentials authorize error:", error);
          return null;
        }
      },
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
    async redirect({ url, baseUrl, token }) {
      // Use NEXTAUTH_URL for production environment
      const productionUrl = process.env.NEXTAUTH_URL || "https://campus-store-online.vercel.app";
      
      // Handle role-based redirects
      if (token?.role) {
        if (token.isAdmin) {
          return `${productionUrl}/admin/dashboard`;
        } else if (token.role === "student") {
          return `${productionUrl}/student`;
        } else if (token.role === "shop_owner") {
          return `${productionUrl}/shop`;
        } else if (token.role === "") {
          return `${productionUrl}/setup-profile`;
        }
      }
      
      // Default redirect logic
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
