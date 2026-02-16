import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const trackedStatuses = ["accepted", "declined", "delivered"] as const;

export async function GET() {
  const session = await getSessionUser();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 5);
  start.setHours(0, 0, 0, 0);

  const [orders, shops, last24hCount] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lte: now } },
      select: { id: true, status: true, createdAt: true, shopId: true },
    }),
    prisma.shop.findMany({ select: { id: true, name: true } }),
    prisma.order.count({ where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
  ]);

  const dayKeys: { key: string; label: string }[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < 6; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    const label = cursor.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    dayKeys.push({ key, label });
    cursor.setDate(cursor.getDate() + 1);
  }

  const initialSeries = dayKeys.map((d) => ({
    date: d.label,
    dateKey: d.key,
    accepted: 0,
    declined: 0,
    delivered: 0,
  }));

  const shopMap = new Map(
    shops.map((shop) => [
      shop.id,
      {
        id: shop.id,
        name: shop.name,
        data: initialSeries.map((row) => ({ ...row })),
      },
    ])
  );

  orders.forEach((order) => {
    if (!trackedStatuses.includes(order.status as (typeof trackedStatuses)[number])) return;
    const dayKey = order.createdAt.toISOString().slice(0, 10);
    const shopEntry = shopMap.get(order.shopId);
    if (!shopEntry) return;
    const dayRow = shopEntry.data.find((row) => row.dateKey === dayKey);
    if (!dayRow) return;
    if (order.status === "accepted") dayRow.accepted += 1;
    if (order.status === "declined") dayRow.declined += 1;
    if (order.status === "delivered") dayRow.delivered += 1;
  });

  return NextResponse.json({
    last24hTotal: last24hCount,
    shops: Array.from(shopMap.values()),
  });
}
