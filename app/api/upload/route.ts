import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { auth } from "@/auth";
import { headers, cookies } from "next/headers";
import fs from "fs";
import path from "path";

// Optional: Vercel Blob support
// npm install @vercel/blob
// To enable, add BLOB_READ_WRITE_TOKEN to environment variables
let put: any;
try {
    const blob = require("@vercel/blob");
    put = blob.put;
} catch {
    // console.log("Vercel Blob package not installed. Falling back to local/tmp storage.");
}

// Ensure upload directory exists (for local development)
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const TMP_DIR = "/tmp"; // Vercel allowed temp storage

if (!fs.existsSync(UPLOAD_DIR)) {
    try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    } catch {
        // console.log("Could not create public/uploads, likely on read-only filesystem.");
    }
}

const ALLOWED_EXTENSIONS = [
    ".pdf", ".pptx", ".ppt", ".doc", ".docx", ".zip", 
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".csv", ".xlsx", ".xls", ".txt"
];
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/plain"
];

export async function POST(req: NextRequest) {
    await headers();
    await cookies();
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const fileExt = path.extname(file.name).toLowerCase();
        const mimeType = file.type;

        if (!ALLOWED_EXTENSIONS.includes(fileExt) || !ALLOWED_MIME_TYPES.includes(mimeType)) {
            return NextResponse.json({ 
                error: `File type ${fileExt} (${mimeType}) not allowed.`,
                hint: "Images, PDFs, Word, PPT, Excel, and CSV are supported."
            }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) { // Increased to 20MB
            return NextResponse.json({ error: "File too large. Max 20MB." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 1. Try Vercel Blob if token is available
        if (put && process.env.BLOB_READ_WRITE_TOKEN) {
            try {
                const blob = await put(file.name, buffer, {
                    access: 'public',
                });
                return NextResponse.json({
                    url: blob.url,
                    fileType: file.type,
                    format: getFormat(file.type, fileExt),
                    extension: fileExt.replace(".", "").toUpperCase(),
                    storage: "vercel-blob"
                });
            } catch (blobErr) {
                console.error("Vercel Blob error:", blobErr);
                // Fallback to local/tmp logic if blob fails
            }
        }

        const fileNameWithoutExt = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9-]/g, "_");
        const uniqueFileName = `${fileNameWithoutExt}-${Date.now()}${fileExt}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFileName);

        try {
            // Save file locally (Standard logic)
            fs.writeFileSync(filePath, buffer);
            const publicUrl = `/uploads/${uniqueFileName}`;
            return NextResponse.json({
                url: publicUrl,
                fileType: file.type,
                format: getFormat(file.type, fileExt),
                extension: fileExt.replace(".", "").toUpperCase(),
                storage: "local"
            });
        } catch (fsErr: any) {
            if (fsErr.code === 'EROFS') {
                // If on Vercel/Serverless and no Blob token, we are stuck for persistence
                // But we can try /tmp as a VERY TEMPORARY fallback for the current request
                const tmpPath = path.join(TMP_DIR, uniqueFileName);
                try {
                    fs.writeFileSync(tmpPath, buffer);
                    // NOTE: This file won't be served by Next.js from /uploads/
                    // So we must inform the user.
                    return NextResponse.json({ 
                        error: "Production filesystem is read-only. Please configure Vercel Blob (BLOB_READ_WRITE_TOKEN) for persistent storage.",
                        code: "EROFS_FALLBACK_FAILED" 
                    }, { status: 507 });
                } catch {
                    throw new Error("Local filesystem is read-only and /tmp is unavailable.");
                }
            }
            throw fsErr;
        }

    } catch (e: any) {
        console.error("Upload error:", e);
        return NextResponse.json({ error: e.message || "Failed to upload file" }, { status: 500 });
    }
}

function getFormat(mimeType: string, ext: string): string {
    const ft = mimeType.toLowerCase();
    if (ft.includes("pdf")) return "PDF";
    if (ft.includes("image")) return "IMAGE";
    if (ft.includes("powerpoint") || ft.includes("presentation") || ext === ".pptx" || ext === ".ppt") return "SLIDES";
    if (ft.includes("sheet") || ft.includes("excel") || ext === ".xlsx" || ext === ".xls" || ext === ".csv") return "SPREADSHEET";
    if (ft.includes("word") || ft.includes("document") || ext === ".docx" || ext === ".doc") return "DOCUMENT";
    return "OTHER";
}
