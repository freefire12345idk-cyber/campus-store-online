import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const contacts = await prisma.supportContact.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Database error in /api/support:", error);
    // Return empty array if database is not available during build
    return NextResponse.json([]);
  }
}
