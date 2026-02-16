import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || session.role;
  if (session.role === "student") {
    if (!session.studentId) return NextResponse.json({ error: "Student profile required" }, { status: 400 });
    const orders = await prisma.order.findMany({
      where: { studentId: session.studentId },
      include: {
        shop: { include: { owner: { include: { user: true } } } },
        items: { include: { product: true } },
        college: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } else {
    if (!session.shopId) return NextResponse.json({ error: "Shop required" }, { status: 400 });
    const orders = await prisma.order.findMany({
      where: { shopId: session.shopId },
      include: { student: { include: { user: true } }, items: { include: { product: true } }, college: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }
}

const createSchema = z.object({
  shopId: z.string(),
  collegeId: z.string(),
  hostelBranch: z.string().optional(),
  rollNo: z.string().optional(),
  paymentProofUrl: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.coerce.number().int().positive(),
    price: z.coerce.number().positive(),
  })),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session?.studentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    if (!session.collegeId) return NextResponse.json({ error: "College required" }, { status: 400 });
    if (data.collegeId !== session.collegeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const shop = await prisma.shop.findFirst({
      where: { id: data.shopId, isApproved: true, isBanned: false },
    });
    if (!shop) return NextResponse.json({ error: "Shop not available" }, { status: 400 });
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const availableProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, shopId: data.shopId, isBanned: false },
      select: { id: true },
    });
    if (availableProducts.length !== productIds.length) {
      return NextResponse.json({ error: "One or more items are unavailable" }, { status: 400 });
    }
    const totalAmount = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = await prisma.order.create({
      data: {
        studentId: session.studentId,
        shopId: data.shopId,
        collegeId: data.collegeId,
        totalAmount,
        status: "pending_accept",
        paymentProofUrl: data.paymentProofUrl,
        hostelBranch: data.hostelBranch,
        rollNo: data.rollNo,
        deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { shop: true, items: { include: { product: true } }, college: true },
    });
    const shopOwner = await prisma.shopOwner.findUnique({ where: { shopId: data.shopId }, include: { user: true } });
    if (shopOwner) {
      await prisma.notification.create({
        data: {
          orderId: order.id,
          userId: shopOwner.userId,
          title: "New order",
          body: `Order #${order.id.slice(-6)} - ₹${totalAmount.toFixed(2)}. Check payment proof and accept/decline.`,
        },
      });
    }
    return NextResponse.json(order);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid data", details: e.flatten() }, { status: 400 });
    console.error(e);
    const message = e instanceof Error ? e.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
