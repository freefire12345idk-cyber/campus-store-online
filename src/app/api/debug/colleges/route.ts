export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    console.log("🔍 Fetching available colleges from database...");
    
    const colleges = await prisma.college.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`✅ Found ${colleges.length} colleges in database`);
    
    return NextResponse.json({
      success: true,
      count: colleges.length,
      colleges: colleges,
      message: colleges.length > 0 
        ? "Colleges loaded successfully" 
        : "No colleges found in database"
    });
  } catch (error) {
    console.error("❌ Error fetching colleges:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch colleges",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
