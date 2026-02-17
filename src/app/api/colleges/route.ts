import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const colleges = await prisma.college.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(colleges);
  } catch (error) {
    console.error("Database error in /api/colleges:", error);
    // Return empty array if database is not available during build
    return NextResponse.json([]);
  }
}
