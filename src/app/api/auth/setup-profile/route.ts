export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(10),
  role: z.enum(["student", "shop_owner"]),
  collegeId: z.string().optional(),
  section: z.string().optional(),
  hostelBranch: z.string().optional(),
  rollNo: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.id }, include: { student: true, shopOwner: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role) return NextResponse.json({ error: "Profile already set up" }, { status: 400 });
  try {
    const body = await req.json();
    const data = schema.parse(body);
    if (data.role === "student") {
      if (!data.collegeId) return NextResponse.json({ error: "College required for students" }, { status: 400 });
      const existingPhone = await prisma.user.findFirst({ where: { phone: data.phone } });
      if (existingPhone && existingPhone.id !== user.id) return NextResponse.json({ error: "Phone already registered" }, { status: 400 });
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: data.phone, role: "student" },
      });
      await prisma.student.create({
        data: {
          userId: user.id,
          collegeId: data.collegeId,
          section: data.section,
          hostelBranch: data.hostelBranch,
          rollNo: data.rollNo,
        },
      });
    } else {
      const existingPhone = await prisma.user.findFirst({ where: { phone: data.phone } });
      if (existingPhone && existingPhone.id !== user.id) return NextResponse.json({ error: "Phone already registered" }, { status: 400 });
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: data.phone, role: "shop_owner" },
      });
      await prisma.shopOwner.create({
        data: { userId: user.id },
      });
    }
    const updated = await prisma.user.findUnique({
      where: { id: user.id },
      include: { student: true, shopOwner: true },
    });
    if (updated) {
      const { createSession } = await import("@/lib/auth");
      await createSession({
        id: updated.id,
        phone: updated.phone ?? undefined,
        email: updated.email ?? undefined,
        role: updated.role!,
        name: updated.name,
        isAdmin: updated.isAdmin,
        studentId: updated.student?.id,
        shopOwnerId: updated.shopOwner?.id,
        shopId: updated.shopOwner?.shopId ?? undefined,
        collegeId: updated.student?.collegeId,
      });
    }
    return NextResponse.json({ ok: true, role: data.role });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
