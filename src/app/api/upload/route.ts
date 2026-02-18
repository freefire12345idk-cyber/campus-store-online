import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    
    console.log(" File details:", { filename: file.name, size: file.size, type: file.type });
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Use custom filename if provided, otherwise generate one
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = customFilename || `upload-${Date.now()}.${ext}`;
    
    // Ensure filename doesn't start with / or ./
    const cleanFilename = filename.startsWith('/') || filename.startsWith('./') 
      ? filename.replace(/^\.?\//, '') 
      : filename;
    
    console.log("🎯 Uploading to Supabase:", { filename: cleanFilename, bucket: 'qr-codes' });
    
    // Upload directly to Supabase storage
    const { data, error } = await supabase.storage
      .from('qr-codes')
      .upload(cleanFilename, buffer, {
        contentType: file.type,
        upsert: true // Overwrite if file exists
      });
    
    if (error) {
      console.error("❌ Supabase upload error:", error);
      return NextResponse.json({ 
        error: `Upload failed: ${error.message}` 
      }, { status: 500 });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(cleanFilename);
    
    console.log("✅ File uploaded successfully:", { filename: cleanFilename, publicUrl, ip, size: file.size });
    
    return NextResponse.json({ 
      url: publicUrl,
      filename: cleanFilename,
      message: "File uploaded successfully",
      remainingUploads: 5 - (rateLimitStore.get(ip)?.count || 0)
    });
  } catch (e) {
    console.error("❌ Upload error:", e);
    return NextResponse.json({ error: "Upload failed due to server error" }, { status: 500 });
  }
}
