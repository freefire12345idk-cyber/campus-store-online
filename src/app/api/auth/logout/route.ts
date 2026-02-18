import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { signOut } from "next-auth/react";

export async function POST() {
  try {
    console.log("🔒 Logging out user...");
    
    // Clear custom session
    await destroySession();
    
    // Clear all possible session cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Delete all session-related cookies
    cookieStore.delete("campus_session");
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("next-auth.callback-url");
    cookieStore.delete("authjs.session-token");
    cookieStore.delete("authjs.csrf-token");
    cookieStore.delete("authjs.callback-url");
    cookieStore.delete("__Secure-next-auth.session-token");
    cookieStore.delete("__Host-next-auth.session-token");
    
    // Log all cookies being deleted
    console.log("🗑️ Deleting cookies:", allCookies.map(c => c.name));
    
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
