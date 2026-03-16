import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Generate a safe unique filename to prevent overwriting
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileExt = path.extname(file.name);
        const fileNameWithoutExt = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9-]/g, "_");
        const uniqueFileName = `${fileNameWithoutExt}-${Date.now()}${fileExt}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFileName);

        // Save file locally (in production you would upload to S3 here)
        fs.writeFileSync(filePath, buffer);

        // Return the public URL and detected formats
        const publicUrl = `/uploads/${uniqueFileName}`;
        let formatStr = "OTHER";
        // Attempt simple format grouping
        const ft = file.type.toLowerCase();
        if (ft.includes("pdf")) formatStr = "PDF";
        else if (ft.includes("image") || ft.includes("powerpoint") || ft.includes("presentation") || fileExt === ".pptx") formatStr = "SLIDES";
        else if (ft.includes("text/plain") || fileExt === ".js" || fileExt === ".py" || fileExt === ".ts" || fileExt === ".zip") formatStr = "CODE";

        return NextResponse.json({
            url: publicUrl,
            fileType: file.type,
            format: formatStr, // Standardized grouping for the system
            extension: fileExt.replace(".", "").toUpperCase()
        });

    } catch (e: any) {
        console.error("Upload error:", e);
        return NextResponse.json({ error: e.message || "Failed to upload file" }, { status: 500 });
    }
}
