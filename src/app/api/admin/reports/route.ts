import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const reports = await prisma.report.findMany({
    include: {
      reporter: true,
      shop: true,
      student: { include: { user: true } },
      product: true,
      order: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reports);
}
