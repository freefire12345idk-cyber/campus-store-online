export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

const studentSchema = z.object({
  role: z.literal("student"),
  email: z.string().email("Valid email is required"),
  phone: z.string().length(10, "Phone number must be exactly 10 digits"),
  password: z.string().min(6),
  name: z.string().optional(),
  collegeId: z.string().min(1, "College selection is required"),
  section: z.string().min(1, "Section is required"),
  hostelBranch: z.string().min(1, "Branch is required"),
  rollNo: z.string().min(1, "Roll number is required"),
  otpVerified: z.boolean().refine(val => val === true, "Email verification is required"),
});

const shopOwnerSchema = z.object({
  role: z.literal("shop_owner"),
  email: z.string().email("Valid email is required"),
  phone: z.string().length(10, "Phone number must be exactly 10 digits"),
  password: z.string().min(6),
  name: z.string().optional(),
  shopName: z.string(),
  shopAddress: z.string().optional(),
  shopLat: z.number(),
  shopLng: z.number(),
  shopPhone: z.string().optional(),
  shopPhotoUrl: z.string(),
  paymentQrUrl: z.string(),
  collegeIds: z.array(z.string()).min(1),
  otpVerified: z.boolean().refine(val => val === true, "Email verification is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.role === "student") {
      const data = studentSchema.parse(body);
      
      // Check if email already exists
      const existingEmail = await prisma.user.findFirst({ where: { email: data.email } });
      if (existingEmail) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      
      // Check if phone already exists
      const existingPhone = await prisma.user.findFirst({ where: { phone: data.phone } });
      if (existingPhone) return NextResponse.json({ error: "Phone already registered" }, { status: 400 });
      
      const hashed = await hashPassword(data.password);
      const user = await prisma.user.create({
        data: {
          phone: data.phone,
          email: data.email,
          password: hashed,
          role: data.role,
          name: data.name || undefined,
          student: {
            create: {
              collegeId: data.collegeId,
              section: data.section,
              hostelBranch: data.hostelBranch,
              rollNo: data.rollNo,
            },
          },
        },
        include: { student: true },
      });
      await createSession({
        id: user.id,
        phone: user.phone ?? undefined,
        email: user.email ?? undefined,
        role: "student",
        name: user.name,
        studentId: user.student!.id,
        collegeId: user.student!.collegeId,
      });
      return NextResponse.json({ ok: true, user: { id: user.id, role: "student" } });
    } else {
      const data = shopOwnerSchema.parse(body);
      
      // Check if email already exists
      const existingEmail = await prisma.user.findFirst({ where: { email: data.email } });
      if (existingEmail) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      
      // Check if phone already exists
      const existingPhone = await prisma.user.findFirst({ where: { phone: data.phone } });
      if (existingPhone) return NextResponse.json({ error: "Phone already registered" }, { status: 400 });
      
      const hashed = await hashPassword(data.password);
      const shop = await prisma.shop.create({
        data: {
          name: data.shopName,
          address: data.shopAddress,
          latitude: data.shopLat,
          longitude: data.shopLng,
          phone: data.shopPhone,
          shopPhoto: data.shopPhotoUrl,
          paymentQrUrl: data.paymentQrUrl,
          isApproved: false,
          shopColleges: {
            create: data.collegeIds.map((collegeId) => ({ collegeId })),
          },
        },
      });
      const user = await prisma.user.create({
        data: {
          phone: data.phone,
          email: data.email,
          password: hashed,
          role: "shop_owner",
          name: data.name,
          shopOwner: {
            create: {
              shopId: shop.id,
            },
          },
        },
        include: { shopOwner: true },
      });
      await createSession({
        id: user.id,
        phone: user.phone ?? undefined,
        email: user.email ?? undefined,
        role: "shop_owner",
        name: user.name,
        shopOwnerId: user.shopOwner!.id,
        shopId: shop.id,
      });
      return NextResponse.json({ ok: true, user: { id: user.id, role: "shop_owner", shopId: shop.id } });
    }
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
