export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check all email environment variables
    const emailConfig = {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? "SET" : "NOT SET",
      DATABASE_URL: process.env.DATABASE_URL?.substring(0, 20) + "...", // Show first 20 chars for security
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log("=== EMAIL CONFIGURATION CHECK ===");
    console.log("Email Host:", emailConfig.EMAIL_HOST);
    console.log("Email Port:", emailConfig.EMAIL_PORT);
    console.log("Email User:", emailConfig.EMAIL_USER ? "CONFIGURED" : "MISSING");
    console.log("Email Pass:", emailConfig.EMAIL_PASS);
    console.log("Database URL:", emailConfig.DATABASE_URL);
    console.log("Node Environment:", emailConfig.NODE_ENV);

    const isConfigured = !!(emailConfig.EMAIL_HOST && emailConfig.EMAIL_USER && emailConfig.EMAIL_PASS);

    return NextResponse.json({
      status: "ok",
      configured: isConfigured,
      config: emailConfig,
      message: isConfigured 
        ? "Email is properly configured" 
        : "Email configuration is incomplete",
      recommendations: !isConfigured ? [
        "Set EMAIL_HOST in environment variables",
        "Set EMAIL_USER in environment variables", 
        "Set EMAIL_PASS in environment variables"
      ] : []
    });
  } catch (error) {
    console.error("Error checking email config:", error);
    return NextResponse.json({
      status: "error",
      error: "Failed to check email configuration",
      details: error
    }, { status: 500 });
  }
}
