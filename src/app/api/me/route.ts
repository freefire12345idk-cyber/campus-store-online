import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    console.log("API /me called");
    const user = await getSessionUser();
    console.log("Session user:", user);
    
    if (!user) {
      console.log("No user found in session");
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    
    console.log("User found:", user.id, user.role);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in /api/me:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
