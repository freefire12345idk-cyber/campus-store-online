import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customFilename = formData.get("filename") as string | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 });
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only images are allowed" }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dir = path.join(process.cwd(), "public", "uploads");
    
    try {
      await mkdir(dir, { recursive: true });
    } catch (mkdirError) {
      console.error("❌ Failed to create uploads directory:", mkdirError);
      return NextResponse.json({ error: "Permission denied: Cannot create upload directory" }, { status: 500 });
    }
    
    // Use custom filename if provided, otherwise generate one
    const ext = path.extname(file.name) || ".jpg";
    const filename = customFilename || `upload-${Date.now()}${ext}`;
    const filePath = path.join(dir, filename);
    
    try {
      await writeFile(filePath, buffer);
    } catch (writeError) {
      console.error("❌ Failed to write file:", writeError);
      return NextResponse.json({ error: "Permission denied: Cannot write file" }, { status: 500 });
    }
    
    const url = `/uploads/${filename}`;
    console.log("✅ File uploaded successfully:", { filename, url, size: file.size });
    
    return NextResponse.json({ url, filename });
  } catch (e) {
    console.error("❌ Upload error:", e);
    return NextResponse.json({ error: "Upload failed due to server error" }, { status: 500 });
  }
}
