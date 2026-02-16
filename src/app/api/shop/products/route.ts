import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session?.shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId") || session.shopId;
  if (shopId !== session.shopId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const products = await prisma.product.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

const createSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session?.shopId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const data = createSchema.parse({ ...body, price: Number(body.price) });
    const product = await prisma.product.create({
      data: { shopId: session.shopId, ...data },
    });
    return NextResponse.json(product);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
