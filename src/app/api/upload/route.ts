import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function (5 uploads per hour per IP)
function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    // First request or expired record
    rateLimitStore.set(ip, { count: 1, resetTime: now + oneHour });
    return { allowed: true };
  }
  
  if (record.count >= 5) {
    return { allowed: false, resetTime: record.resetTime };
  }
  
  // Increment count
  rateLimitStore.set(ip, { count: record.count + 1, resetTime: record.resetTime });
  return { allowed: true };
}

export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    console.log("🔍 Upload request from IP:", ip);
    
    // Check rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime!).toLocaleTimeString();
      console.log("🚫 Rate limit exceeded for IP:", ip);
      return NextResponse.json({ 
        error: `Rate limit exceeded. Please try again after ${resetTime}. Maximum 5 uploads per hour.` 
      }, { status: 429 });
    }
    
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customFilename = formData.get("filename") as string | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log("❌ File too large:", { size: file.size, maxSize });
      return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 });
    }
    
    // Check file type - stricter validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.log("❌ Invalid file type:", { type: file.type });
      return NextResponse.json({ error: "Invalid file type. Only JPG, JPEG, and PNG files are allowed" }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dir = path.join(process.cwd(), "public", "uploads");
    
    console.log("📁 Upload directory:", dir);
    console.log("📄 File details:", { filename: file.name, size: file.size, type: file.type });
    
    try {
      await mkdir(dir, { recursive: true });
      console.log("✅ Upload directory created/verified");
    } catch (mkdirError) {
      console.error("❌ Failed to create uploads directory:", mkdirError);
      return NextResponse.json({ error: "Permission denied: Cannot create upload directory" }, { status: 500 });
    }
    
    // Use custom filename if provided, otherwise generate one
    const ext = path.extname(file.name) || ".jpg";
    const filename = customFilename || `upload-${Date.now()}${ext}`;
    const filePath = path.join(dir, filename);
    
    console.log("🎯 Target file path:", filePath);
    
    try {
      // Check if file exists and overwrite (for shop photo updates)
      await writeFile(filePath, buffer);
      console.log("✅ File uploaded successfully:", { filename, ip, size: file.size, filePath });
    } catch (writeError) {
      console.error("❌ Failed to write file:", writeError);
      const error = writeError as Error;
      console.error("❌ Write error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        path: filePath,
        dir: dir
      });
      return NextResponse.json({ 
        error: `Permission denied: Cannot write file. Error: ${error.message}` 
      }, { status: 500 });
    }
    
    const url = `/uploads/${filename}`;
    
    return NextResponse.json({ 
      url, 
      filename,
      message: "File uploaded successfully",
      remainingUploads: 5 - (rateLimitStore.get(ip)?.count || 0)
    });
  } catch (e) {
    console.error("❌ Upload error:", e);
    return NextResponse.json({ error: "Upload failed due to server error" }, { status: 500 });
  }
}
