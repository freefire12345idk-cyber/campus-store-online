import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopColleges = await prisma.shopCollege.findMany({
    where: { shopId: session.shopId },
    include: { college: true },
  });
  return NextResponse.json(shopColleges.map((sc) => sc.college));
}

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session?.shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { collegeIds } = await req.json();
  if (!Array.isArray(collegeIds)) return NextResponse.json({ error: "collegeIds array required" }, { status: 400 });
  await prisma.shopCollege.deleteMany({ where: { shopId: session.shopId } });
  if (collegeIds.length > 0) {
    await prisma.shopCollege.createMany({
      data: collegeIds.map((collegeId: string) => ({ shopId: session.shopId!, collegeId })),
      skipDuplicates: true,
    });
  }
  const updated = await prisma.shopCollege.findMany({
    where: { shopId: session.shopId },
    include: { college: true },
  });
  return NextResponse.json(updated.map((sc) => sc.college));
}
