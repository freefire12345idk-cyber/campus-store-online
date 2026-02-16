import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  
  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
  }

  try {
    const tokens = await prisma.verificationToken.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({ 
      email,
      tokenCount: tokens.length,
      tokens: tokens.map(t => ({
        id: t.id,
        token: t.token,
        expiresAt: t.expiresAt,
        createdAt: t.createdAt,
        isExpired: new Date() > t.expiresAt
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to fetch tokens",
      details: error 
    }, { status: 500 });
  }
}
