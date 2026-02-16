import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  status: z.string().optional(),
  banShop: z.boolean().optional(),
  banStudent: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const report = await prisma.report.findUnique({
      where: { id },
      include: { shop: true, student: { include: { user: true } } },
    });
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (data.banShop && report.shopId) {
      await prisma.shop.update({ where: { id: report.shopId }, data: { isBanned: true } });
    }
    if (data.banStudent && report.student?.userId) {
      await prisma.user.update({ where: { id: report.student.userId }, data: { isBanned: true } });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { status: data.status ?? report.status },
      include: {
        reporter: true,
        shop: true,
        student: { include: { user: true } },
        product: true,
        order: true,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
