import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { shop: true, student: { include: { user: true } }, items: { include: { product: true } }, college: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role === "student" && order.studentId !== session.studentId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (session.role === "shop_owner" && order.shopId !== session.shopId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(order);
}

const statusSchema = ["accepted", "declined", "preparing", "out_for_delivery", "reached_location", "delivered"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session?.shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id, shopId: session.shopId } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const status = body.status as string;
  if (!statusSchema.includes(status as typeof statusSchema[number]))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: { shop: true, student: { include: { user: true } }, items: { include: { product: true } }, college: true },
  });
  if (status === "accepted" || status === "declined") {
    const student = await prisma.student.findUnique({ where: { id: order.studentId }, include: { user: true } });
    if (student) {
      await prisma.notification.create({
        data: {
          orderId: order.id,
          userId: student.userId,
          title: status === "accepted" ? "Order accepted" : "Order declined",
          body: status === "accepted" ? `Your order #${id.slice(-6)} has been accepted.` : `Your order #${id.slice(-6)} was declined.`,
        },
      });
    }
  }
  if (status === "out_for_delivery") {
    const student = await prisma.student.findUnique({ where: { id: order.studentId }, include: { user: true } });
    if (student) {
      await prisma.notification.create({
        data: {
          orderId: order.id,
          userId: student.userId,
          title: "Order on the way",
          body: `Your order #${id.slice(-6)} is out for delivery. Get your OTP ready!`,
        },
      });
    }
  }
  if (status === "reached_location") {
    const student = await prisma.student.findUnique({ where: { id: order.studentId }, include: { user: true } });
    if (student) {
      await prisma.notification.create({
        data: {
          orderId: order.id,
          userId: student.userId,
          title: "Reached at location",
          body: `Your order #${id.slice(-6)} has reached the delivery location. Please collect your order!`,
        },
      });
    }
  }
  if (status === "delivered") {
    const student = await prisma.student.findUnique({ where: { id: order.studentId }, include: { user: true } });
    if (student) {
      await prisma.notification.create({
        data: {
          orderId: order.id,
          userId: student.userId,
          title: "Order delivered",
          body: `Your order #${id.slice(-6)} has been delivered. Thank you!`,
        },
      });
    }
  }
  return NextResponse.json(updated);
}
