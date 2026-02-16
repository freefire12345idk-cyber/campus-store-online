import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const shops = await prisma.shop.findMany({
    include: {
      owner: { include: { user: true } },
      shopColleges: { include: { college: true } },
      products: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(shops);
}
