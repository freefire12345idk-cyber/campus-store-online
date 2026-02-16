import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const isBanned = typeof body.isBanned === "boolean" ? body.isBanned : undefined;
  if (isBanned == null) return NextResponse.json({ error: "isBanned required" }, { status: 400 });
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.product.update({ where: { id }, data: { isBanned } });
  return NextResponse.json(updated);
}
