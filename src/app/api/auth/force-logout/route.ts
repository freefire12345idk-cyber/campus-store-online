export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    console.log("🔒 FORCE LOGOUT - Clearing all sessions...");
    
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log("🍪 Current cookies:", allCookies.map(c => `${c.name}=${c.value}`));
    
    // Delete EVERY possible session cookie
    const cookiesToDelete = [
      "campus_session",
      "next-auth.session-token", 
      "next-auth.csrf-token",
      "next-auth.callback-url",
      "authjs.session-token",
      "authjs.csrf-token", 
      "authjs.callback-url",
      "__Secure-next-auth.session-token",
      "__Host-next-auth.session-token",
      "next-auth.pkce.code",
      "next-auth.state",
      "next-auth.nonce"
    ];
    
    cookiesToDelete.forEach(cookieName => {
      cookieStore.delete(cookieName);
      console.log(`🗑️ Deleted: ${cookieName}`);
    });
    
    console.log("✅ FORCE LOGOUT COMPLETE - All sessions cleared");
    
    return NextResponse.json({ 
      success: true, 
      message: "Force logout successful - all sessions cleared",
      cookiesCleared: cookiesToDelete.length
    });
  } catch (error) {
    console.error("❌ Force logout error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to force logout" 
    }, { status: 500 });
  }
}
