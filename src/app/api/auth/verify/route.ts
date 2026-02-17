import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

const sendOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6),
});

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create nodemailer transporter
function createTransporter() {
  console.log("=== Email Configuration Debug ===");
  console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
  console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
  console.log("Using Email:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");
  
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Email configuration missing. OTP will only be logged to console.");
    return null;
  }

  console.log("✅ Creating email transporter...");
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_PORT === "465", // Use SSL for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Important for some email providers
    }
  });

  // Verify transporter connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Transporter verification failed:", error);
    } else {
      console.log("✅ Transporter is ready to send emails");
    }
  });

  return transporter;
}

// Send OTP to email
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "send") {
      const data = sendOtpSchema.parse(body);
      
      // Delete any existing tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { email: data.email },
      });

      // Generate new OTP
      const token = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      // Save token to database
      console.log("📝 Creating verification token in database...");
      const dbToken = await prisma.verificationToken.create({
        data: {
          email: data.email,
          token,
          expiresAt,
        },
      });
      console.log("✅ Database token created:", dbToken.id);

      // Try to send email
      const transporter = createTransporter();
      if (transporter) {
        try {
          console.log("📧 Attempting to send email to:", data.email);
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: data.email,
            subject: "Campus Store - Email Verification OTP",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; text-align: center;">Email Verification</h2>
                <p style="color: #666; font-size: 16px;">Your OTP for Campus Store registration is:</p>
                <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                  <span style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 4px;">${token}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
              </div>
            `,
          };
          
          const result = await transporter.sendMail(mailOptions);
          console.log("✅ Email sent successfully!");
          console.log("Message ID:", result.messageId);
          console.log("Response:", result.response);
          
        } catch (emailError) {
          console.error("❌ EMAIL SENDING FAILED:");
          console.error("Error details:", emailError);
          console.error("Error code:", (emailError as any).code);
          console.error("Error message:", (emailError as any).message);
          
          // Return 500 error so frontend can see it
          return NextResponse.json({ 
            error: `Email sending failed: ${(emailError as Error).message}`,
            details: emailError
          }, { status: 500 });
        }
      } else {
        // No email config, show OTP in console
        console.log("⚠️ No email configuration, showing OTP in console only");
      }

      // In development, always return OTP for testing
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ 
          success: true, 
          message: "OTP sent successfully",
          otp: token // Only in development
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: "OTP sent to your email" 
      });
    }

    if (action === "verify") {
      const data = verifyOtpSchema.parse(body);
      
      // Find valid token
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          email: data.email,
          token: data.token,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!verificationToken) {
        return NextResponse.json({ 
          error: "Invalid or expired OTP" 
        }, { status: 400 });
      }

      // Delete the token after successful verification
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json({ 
        success: true, 
        message: "Email verified successfully" 
      });
    }

    return NextResponse.json({ 
      error: "Invalid action" 
    }, { status: 400 });

  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: e.flatten() }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "Failed to process OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
