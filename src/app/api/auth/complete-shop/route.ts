import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  shopName: z.string(),
  shopAddress: z.string().optional(),
  shopLat: z.number(),
  shopLng: z.number(),
  shopPhone: z.string().optional(),
  shopPhotoUrl: z.string(),
  paymentQrUrl: z.string(),
  collegeIds: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session?.shopOwnerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const owner = await prisma.shopOwner.findUnique({ where: { id: session.shopOwnerId }, include: { shop: true } });
  if (!owner || owner.shopId) return NextResponse.json({ error: "Shop already created or invalid" }, { status: 400 });
  try {
    const body = await req.json();
    const data = schema.parse(body);
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
    await prisma.shopOwner.update({
      where: { id: session.shopOwnerId },
      data: { shopId: shop.id },
    });
    const { createSession } = await import("@/lib/auth");
    await createSession({
      ...session,
      shopId: shop.id,
    });
    return NextResponse.json({ ok: true, shopId: shop.id });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }
}
