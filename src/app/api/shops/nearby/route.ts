import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session?.studentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const collegeId = searchParams.get("collegeId");
  if (!collegeId) return NextResponse.json({ error: "collegeId required" }, { status: 400 });
  
  // Remove college validation check - allow students to browse any college
  // if (session.collegeId && session.collegeId !== collegeId) {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }
  
  const college = await prisma.college.findUnique({ where: { id: collegeId } });
  if (!college) return NextResponse.json({ error: "College not found" }, { status: 404 });
  const shops = await prisma.shop.findMany({
    where: {
      isApproved: true,
      isBanned: false,
      shopColleges: { some: { collegeId } },
    },
    include: {
      shopColleges: { include: { college: true } },
      products: { where: { isBanned: false } },
    },
  });
  return NextResponse.json(shops);
}
