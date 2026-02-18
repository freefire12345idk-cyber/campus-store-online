import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    console.log("🔒 Logging out user...");
    
    // Clear custom session
    await destroySession();
    
    // Clear all possible session cookies
    const cookieStore = await cookies();
    cookieStore.delete("campus_session");
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("next-auth.callback-url");
    
    console.log("✅ User logged out successfully");
    
    return NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to logout" 
    }, { status: 500 });
  }
}
