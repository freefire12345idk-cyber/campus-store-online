import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["fake_payment", "bad_product"]),
  description: z.string().min(5),
  attachmentUrl: z.string().optional(),
  orderId: z.string(),
  productId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    if (session.role === "shop_owner") {
      if (!session.shopId) return NextResponse.json({ error: "Shop required" }, { status: 400 });
      if (data.type !== "fake_payment") return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
      const order = await prisma.order.findFirst({
        where: { id: data.orderId, shopId: session.shopId },
      });
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      const report = await prisma.report.create({
        data: {
          type: data.type,
          description: data.description,
          attachmentUrl: data.attachmentUrl,
          reporterId: session.id,
          shopId: session.shopId,
          studentId: order.studentId,
          orderId: order.id,
        },
      });
      return NextResponse.json(report);
    }

    if (session.role === "student") {
      if (!session.studentId) return NextResponse.json({ error: "Student required" }, { status: 400 });
      if (data.type !== "bad_product") return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
      const order = await prisma.order.findFirst({
        where: { id: data.orderId, studentId: session.studentId },
        include: { items: true },
      });
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      if (data.productId && !order.items.some((i) => i.productId === data.productId)) {
        return NextResponse.json({ error: "Product not in order" }, { status: 400 });
      }
      const report = await prisma.report.create({
        data: {
          type: data.type,
          description: data.description,
          attachmentUrl: data.attachmentUrl,
          reporterId: session.id,
          shopId: order.shopId,
          studentId: session.studentId,
          productId: data.productId,
          orderId: order.id,
        },
      });
      return NextResponse.json(report);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
