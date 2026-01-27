import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Get file extension
    const ext = path.extname(file.name);
    const allowedExtensions = [
      ".jpg", ".jpeg", ".png", ".gif", ".webp", // images
      ".pdf", ".doc", ".docx", ".xls", ".xlsx", // documents
      ".txt", ".csv", // text
    ];

    if (!allowedExtensions.includes(ext.toLowerCase())) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Create unique filename
    const filename = `${uuidv4()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, filename), buffer);

    // Return the public URL
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: fileUrl, filename: file.name });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
