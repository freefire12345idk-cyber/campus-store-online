import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteUploadByUrl } from "@/lib/deleteUpload";

const DAYS = 7;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS);
  const oldOrders = await prisma.order.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, paymentProofUrl: true },
  });

  let deleted = 0;
  for (const order of oldOrders) {
    if (order.paymentProofUrl) await deleteUploadByUrl(order.paymentProofUrl);
    await prisma.order.delete({ where: { id: order.id } });
    deleted++;
  }

  return NextResponse.json({ ok: true, deleted });
}
