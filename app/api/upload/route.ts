import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers, cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { isAllowedFileType, saveUploadedFile } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Vercel serverless request body max size is 4.5MB for serverless functions
// We set safe limit to 4.5MB for serverless direct uploads, up to 10MB when supported
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
    await headers();
    await cookies();
    
    const rateLimit = checkRateLimit(req, "general");
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please try again later." },
            {
                status: 429,
                headers: { "Retry-After": String(rateLimit.retryAfter || 900) }
            }
        );
    }

    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!isAllowedFileType(file.name, file.type)) {
            return NextResponse.json({ 
                error: `File type ${file.name} is not allowed.`,
                hint: "Images, PDFs, Word, PowerPoint, Excel, and CSV files are supported."
            }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ 
                error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.` 
            }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await saveUploadedFile({
            originalFilename: file.name,
            buffer,
            mimeType: file.type || "application/octet-stream",
            folder: "resources",
            maxBase64FallbackSize: MAX_FILE_SIZE
        });

        return NextResponse.json({
            url: result.url,
            fileType: file.type,
            format: result.format,
            extension: result.extension,
            storage: result.storage
        });

    } catch (e: any) {
        console.error("Upload error:", e);
        return NextResponse.json({ error: e.message || "Failed to upload file" }, { status: 500 });
    }
}
