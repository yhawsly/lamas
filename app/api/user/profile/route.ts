import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
    try {
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
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        
        // Handle avatar upload if present
        const file = formData.get("avatar") as File;
        let avatarUrl: string | undefined;

        if (file && file.size > 0) {
            // 1. Verify file size before buffering to prevent memory/DoS attacks
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: "Avatar file size exceeds the 2MB limit" },
                    { status: 400 }
                );
            }

            // 2. Enforce strict type/extension validation to prevent Stored XSS (.html uploads)
            const ext = path.extname(file.name).toLowerCase();
            const mimeType = file.type.toLowerCase();

            if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mimeType)) {
                return NextResponse.json(
                    { error: "Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed." },
                    { status: 400 }
                );
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            // Generate a safe unique filename
            const uniqueSuffix = crypto.randomBytes(16).toString("hex");
            const filename = `avatar-${session.user.id}-${uniqueSuffix}${ext}`;
            
            // Save to public/uploads locally (for dev environment fallback)
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            await mkdir(uploadDir, { recursive: true });
            
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);
            
            avatarUrl = `/uploads/${filename}`;
        }

        // Handle other fields
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (phone !== null) updateData.phone = phone; // allow empty phone
        if (avatarUrl) updateData.avatarUrl = avatarUrl;

        const updatedUser = await prisma.user.update({
            where: { id: Number(session.user.id) },
            data: updateData,
            select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return handleApiError(error, "Failed to update profile");
    }
}
