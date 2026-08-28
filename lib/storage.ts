import { put } from "@vercel/blob";
import fs from "fs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Block executable and potentially malicious script binaries
const DISALLOWED_EXTENSIONS = [
    ".exe", ".bat", ".cmd", ".sh", ".dll", ".so", ".dylib", 
    ".vbs", ".msi", ".com", ".scr", ".pif", ".jar", ".app"
];

// Broad list of supported academic, document, media, and code formats
export const ALLOWED_EXTENSIONS = [
    // Documents
    ".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".pages", ".md", ".markdown",
    // Spreadsheets & Data
    ".xlsx", ".xls", ".csv", ".ods", ".tsv", ".numbers", ".json", ".xml", ".sql",
    // Presentations
    ".pptx", ".ppt", ".odp", ".key",
    // Images
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico",
    // Archives
    ".zip", ".rar", ".7z", ".tar", ".gz",
    // Audio & Video
    ".mp4", ".mov", ".avi", ".mkv", ".webm", ".mp3", ".wav", ".m4a", ".ogg",
    // Code & Scripts
    ".py", ".java", ".cpp", ".c", ".cs", ".js", ".ts", ".tsx", ".jsx", ".html", ".css"
];

export function isAllowedFileType(filename: string, mimeType?: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    
    // Explicitly reject dangerous executable binaries
    if (DISALLOWED_EXTENSIONS.includes(ext)) {
        return false;
    }

    // Accept any known allowed extension
    if (ALLOWED_EXTENSIONS.includes(ext)) {
        return true;
    }

    // If extension is not in blacklist and has standard mime type, permit it
    if (ext && ext.length >= 2 && !DISALLOWED_EXTENSIONS.includes(ext)) {
        return true;
    }

    return false;
}

export function getFileFormat(mimeType: string, ext: string): string {
    const ft = (mimeType || "").toLowerCase();
    const e = (ext || "").toLowerCase();

    if (ft.includes("pdf") || e === ".pdf") return "PDF";
    if (ft.includes("image") || [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"].includes(e)) return "IMAGE";
    if (ft.includes("video") || [".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(e)) return "VIDEO";
    if (ft.includes("audio") || [".mp3", ".wav", ".m4a", ".ogg"].includes(e)) return "AUDIO";
    if (ft.includes("powerpoint") || ft.includes("presentation") || [".pptx", ".ppt", ".odp", ".key"].includes(e)) return "SLIDES";
    if (ft.includes("sheet") || ft.includes("excel") || ft.includes("csv") || [".xlsx", ".xls", ".csv", ".ods", ".tsv", ".numbers"].includes(e)) return "SPREADSHEET";
    if ([".zip", ".rar", ".7z", ".tar", ".gz"].includes(e) || ft.includes("zip")) return "ARCHIVE";
    if ([".py", ".java", ".cpp", ".c", ".cs", ".js", ".ts", ".tsx", ".jsx", ".html", ".css", ".json", ".xml", ".sql"].includes(e)) return "CODE";
    if (ft.includes("word") || ft.includes("document") || [".docx", ".doc", ".txt", ".rtf", ".odt", ".pages", ".md", ".markdown"].includes(e)) return "DOCUMENT";
    
    return "OTHER";
}

export interface SaveFileOptions {
    originalFilename: string;
    buffer: Buffer;
    mimeType: string;
    folder?: string;
    maxBase64FallbackSize?: number; // default: 2MB
}

export interface SaveFileResult {
    url: string;
    storage: "vercel-blob" | "local" | "data-url";
    format: string;
    extension: string;
}

/**
 * Robust production file storage helper:
 * 1. Uploads to Vercel Blob if BLOB_READ_WRITE_TOKEN is configured.
 * 2. Falls back to local public/uploads for local development.
 * 3. Falls back to Base64 Data URL for serverless read-only filesystems when Blob token is missing.
 */
export async function saveUploadedFile({
    originalFilename,
    buffer,
    mimeType,
    folder = "uploads",
    maxBase64FallbackSize = 2 * 1024 * 1024,
}: SaveFileOptions): Promise<SaveFileResult> {
    const fileExt = path.extname(originalFilename).toLowerCase();
    const format = getFileFormat(mimeType, fileExt);
    const extension = fileExt.replace(".", "").toUpperCase() || "BIN";

    // 1. Try Vercel Blob if token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const cleanName = path.basename(originalFilename, fileExt).replace(/[^a-zA-Z0-9-]/g, "_");
            const blobPathname = `${folder}/${cleanName}-${Date.now()}${fileExt}`;
            const blob = await put(blobPathname, buffer, {
                access: "public",
                addRandomSuffix: true,
                contentType: mimeType || undefined,
            });

            return {
                url: blob.url,
                storage: "vercel-blob",
                format,
                extension,
            };
        } catch (blobErr) {
            console.error("⚠️ Vercel Blob upload failed, attempting fallback:", blobErr);
        }
    }

    // 2. Local filesystem storage (for development)
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    const cleanBase = path.basename(originalFilename, fileExt).replace(/[^a-zA-Z0-9-]/g, "_");
    const uniqueFileName = `${cleanBase}-${Date.now()}-${uniqueSuffix}${fileExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    try {
        if (!fs.existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, uniqueFileName);
        await writeFile(filePath, buffer);

        return {
            url: `/uploads/${uniqueFileName}`,
            storage: "local",
            format,
            extension,
        };
    } catch (fsErr: any) {
        // 3. Fallback for read-only serverless filesystems (e.g., Vercel without BLOB_READ_WRITE_TOKEN)
        if (fsErr.code === "EROFS" || fsErr.code === "EACCES") {
            if (buffer.length <= maxBase64FallbackSize) {
                const effectiveMime = mimeType || "application/octet-stream";
                const base64Data = buffer.toString("base64");
                const dataUrl = `data:${effectiveMime};base64,${base64Data}`;

                return {
                    url: dataUrl,
                    storage: "data-url",
                    format,
                    extension,
                };
            }

            throw new Error(
                "Production serverless filesystem is read-only. Please set the BLOB_READ_WRITE_TOKEN environment variable in your Vercel/production settings to support files larger than 2MB."
            );
        }

        throw fsErr;
    }
}
