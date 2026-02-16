import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const notificationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  orderId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const data = notificationSchema.parse(body);

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        orderId: data.orderId,
        read: false,
      },
    });

    return NextResponse.json(notification);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: e.flatten() }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Failed to create notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.id,
      ...(unreadOnly && { read: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const notificationId = searchParams.get("id");
  const markAll = searchParams.get("markAll") === "true";

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  if (!notificationId) {
    return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
  }

  const notification = await prisma.notification.updateMany({
    where: { 
      id: notificationId,
      userId: session.id 
    },
    data: { read: true },
  });

  return NextResponse.json({ success: true, updated: notification.count });
}
