import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const SESSION_COOKIE = "campus_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  phone?: string | null;
  email?: string | null;
  role: string;
  name: string | null;
  isAdmin?: boolean;
  isBanned?: boolean;
  studentId?: string;
  shopOwnerId?: string;
  shopId?: string;
  collegeId?: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify(user);
  cookieStore.set(SESSION_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie?.value) return null;
  try {
    return JSON.parse(cookie.value) as SessionUser;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { student: true, shopOwner: { include: { shop: true } } },
  });
  if (!user) return null;
  return {
    id: user.id,
    phone: user.phone ?? undefined,
    email: user.email ?? undefined,
    role: user.role ?? "student",
    name: user.name,
    isAdmin: user.isAdmin,
    isBanned: user.isBanned,
    studentId: user.student?.id,
    shopOwnerId: user.shopOwner?.id,
    shopId: user.shopOwner?.shopId ?? undefined,
    collegeId: user.student?.collegeId,
  };
}
