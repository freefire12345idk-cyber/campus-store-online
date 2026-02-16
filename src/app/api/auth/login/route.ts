import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { phone, email, password } = await req.json();
    const loginId = email?.trim() || phone?.trim();
    if (!loginId || !password) return NextResponse.json({ error: "Email/Phone and password required" }, { status: 400 });
    const isEmail = String(loginId).includes("@");
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: loginId } : { phone: loginId },
      include: { student: true, shopOwner: { include: { shop: true } } },
    });
    if (!user) return NextResponse.json({ error: "Invalid email/phone or password" }, { status: 401 });
    if (!user.password) return NextResponse.json({ error: "This account uses Google sign-in. Please sign in with Google." }, { status: 401 });
    if (!(await verifyPassword(password, user.password)))
      return NextResponse.json({ error: "Invalid email/phone or password" }, { status: 401 });
    await createSession({
      id: user.id,
      phone: user.phone ?? undefined,
      email: user.email ?? undefined,
      role: user.role as string,
      name: user.name,
      isAdmin: user.isAdmin,
      isBanned: user.isBanned,
      studentId: user.student?.id,
      shopOwnerId: user.shopOwner?.id,
      shopId: user.shopOwner?.shopId ?? undefined,
      collegeId: user.student?.collegeId,
    });
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        role: user.role,
        isAdmin: user.isAdmin,
        shopId: user.shopOwner?.shopId,
        collegeId: user.student?.collegeId,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
