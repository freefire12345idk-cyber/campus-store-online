import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteUploadByUrl } from "@/lib/deleteUpload";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: shopId } = await params;
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, include: { owner: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const orders = await prisma.order.findMany({ where: { shopId }, select: { paymentProofUrl: true } });
  for (const order of orders) {
    if (order.paymentProofUrl) await deleteUploadByUrl(order.paymentProofUrl);
  }

  if (shop.owner) {
    await prisma.shopOwner.update({
      where: { id: shop.owner.id },
      data: { shopId: null },
    });
  }
  await prisma.shop.delete({ where: { id: shopId } });
  return NextResponse.json({ ok: true });
}
