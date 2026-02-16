import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Generate test OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save to database
    const dbToken = await prisma.verificationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    console.log("🧪 TEST OTP created for", email);
    console.log("🧪 Token:", token);
    console.log("🧪 Expires at:", expiresAt);
    console.log("🧪 Database ID:", dbToken.id);

    return NextResponse.json({
      success: true,
      message: "Test OTP created (check console)",
      otp: token, // Always show for testing
      debug: {
        email,
        token,
        expiresAt,
        dbId: dbToken.id
      }
    });

  } catch (error) {
    console.error("🧪 Test OTP creation failed:", error);
    return NextResponse.json({ 
      error: "Failed to create test OTP",
      details: error 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  
  if (!email) {
    return NextResponse.json({ 
      message: "Test endpoint - POST with email to create OTP",
      usage: "POST /api/test-otp with { email: 'test@example.com' }"
    });
  }

  try {
    const tokens = await prisma.verificationToken.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 3,
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
      error: "Failed to fetch test tokens",
      details: error 
    }, { status: 500 });
  }
}
