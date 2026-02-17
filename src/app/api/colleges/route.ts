import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withCache, rateLimiter } from "@/lib/cache";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimiter.isAllowed(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Cache colleges for 10 minutes
    return withCache(
      'colleges:list',
      async () => {
        const colleges = await prisma.college.findMany({ 
          orderBy: { name: "asc" },
          select: { // Only select needed fields
            id: true,
            name: true
          }
        });
        return NextResponse.json(colleges);
      },
      10 * 60 * 1000 // 10 minutes
    );
  } catch (error) {
    console.error("Database error in /api/colleges:", error);
    // Return empty array if database is not available during build
    return NextResponse.json([]);
  }
}
