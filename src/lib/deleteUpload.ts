import { unlink } from "fs/promises";
import path from "path";

/**
 * Delete a file from public/uploads by its URL path (e.g. /uploads/pay-123.jpg).
 * Returns true if deleted or file not found; false on error.
 */
export async function deleteUploadByUrl(url: string | null | undefined): Promise<boolean> {
  if (!url || !url.startsWith("/uploads/")) return true;
  try {
    const filePath = path.join(process.cwd(), "public", url.slice(1));
    await unlink(filePath);
    return true;
  } catch (err) {
    return false;
  }
}
