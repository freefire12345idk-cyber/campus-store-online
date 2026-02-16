import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({
    where: { id: session.shopId },
    include: { shopColleges: { include: { college: true } } },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  return NextResponse.json(shop);
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session?.shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name;
  if (body.address != null) data.address = body.address;
  if (body.phone != null) data.phone = body.phone;
  if (body.paymentQrUrl != null) data.paymentQrUrl = body.paymentQrUrl;
  if (body.latitude != null) data.latitude = body.latitude;
  if (body.longitude != null) data.longitude = body.longitude;
  const shop = await prisma.shop.update({
    where: { id: session.shopId },
    data,
  });
  return NextResponse.json(shop);
}
