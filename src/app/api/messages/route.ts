import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const sendSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1).max(2000),
  orderId: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const orderId = searchParams.get("orderId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  
  const whereClause: any = {
    OR: [
      { senderId: session.id, receiverId: userId },
      { senderId: userId, receiverId: session.id },
    ],
  };
  
  if (orderId) {
    whereClause.orderId = orderId;
  }
  
  const messages = await prisma.message.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const data = sendSchema.parse(body);
    const allowedStatuses = ["accepted", "preparing", "out_for_delivery", "reached_location", "delivered"];
    if (session.role === "shop_owner") {
      if (!session.shopId) return NextResponse.json({ error: "Shop required" }, { status: 400 });
      const canChat = await prisma.order.findFirst({
        where: {
          shopId: session.shopId,
          status: { in: allowedStatuses },
          student: { userId: data.receiverId },
        },
        select: { id: true },
      });
      if (!canChat) return NextResponse.json({ error: "Chat not available" }, { status: 403 });
    }
    if (session.role === "student") {
      if (!session.studentId) return NextResponse.json({ error: "Student required" }, { status: 400 });
      const canChat = await prisma.order.findFirst({
        where: {
          studentId: session.studentId,
          status: { in: allowedStatuses },
          shop: { owner: { userId: data.receiverId } },
        },
        select: { id: true },
      });
      if (!canChat) return NextResponse.json({ error: "Chat not available" }, { status: 403 });
    }
    const message = await prisma.message.create({
      data: {
        senderId: session.id,
        receiverId: data.receiverId,
        content: data.content.trim(),
        ...(data.orderId && { orderId: data.orderId }),
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: data.receiverId,
        title: "New Message",
        body: `You have a new message from ${session.name || 'Unknown'}`,
        orderId: data.orderId,
        read: false,
      },
    });

    return NextResponse.json(message);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: e.flatten() }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
