import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shop = await prisma.shop.findFirst({
    where: { id, isApproved: true, isBanned: false },
    include: { products: { where: { isBanned: false } } },
  });
  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(shop);
}
