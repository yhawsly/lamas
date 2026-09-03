import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";
import { saveUploadedFile, isAllowedFileType } from "@/lib/storage";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
const MAX_AVATAR_SIZE = 4 * 1024 * 1024; // 4MB

export async function PATCH(req: NextRequest) {
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
            // 1. Verify file size before buffering
            if (file.size > MAX_AVATAR_SIZE) {
                return NextResponse.json(
                    { error: "Avatar file size exceeds the 4MB limit" },
                    { status: 400 }
                );
            }

            // 2. Enforce strict type/extension validation
            const ext = path.extname(file.name).toLowerCase();
            if (!ALLOWED_AVATAR_EXTENSIONS.includes(ext) || !isAllowedFileType(file.name, file.type)) {
                return NextResponse.json(
                    { error: "Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG images are allowed." },
                    { status: 400 }
                );
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const uploadResult = await saveUploadedFile({
                originalFilename: `avatar-${session.user.id}-${file.name}`,
                buffer,
                mimeType: file.type || "image/jpeg",
                folder: "avatars",
                maxBase64FallbackSize: 4 * 1024 * 1024,
            });
            
            avatarUrl = uploadResult.url;
        }

        // Handle other fields
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (phone !== null && phone !== undefined) updateData.phone = phone;
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
