import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const resId = parseInt(id);
        if (isNaN(resId)) {
            return new NextResponse("Invalid resource ID", { status: 400 });
        }

        const resource = await prisma.resource.findUnique({
            where: { id: resId },
            select: { id: true, url: true, title: true, type: true }
        });

        if (!resource || !resource.url) {
            return new NextResponse("Resource not found", { status: 404 });
        }

        const url = resource.url;
        const cleanTitle = (resource.title || "document").replace(/[^a-zA-Z0-9-_\.]/g, "_");

        // 1. If stored as Base64 Data URL
        if (url.startsWith("data:")) {
            const parts = url.split(",");
            const mimeMatch = parts[0].match(/:(.*?);/);
            const contentType = mimeMatch ? mimeMatch[1] : "application/pdf";
            const buffer = Buffer.from(parts[1], "base64");

            return new Response(buffer, {
                headers: {
                    "Content-Type": contentType,
                    "Content-Disposition": `inline; filename="${cleanTitle}.pdf"`,
                    "Content-Length": buffer.length.toString(),
                    "Cache-Control": "public, max-age=3600",
                },
            });
        }

        // 2. If stored as local uploaded file path (e.g. /uploads/...)
        if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
            const filename = path.basename(url);
            const filePath = path.join(process.cwd(), "public", "uploads", filename);

            if (fs.existsSync(filePath)) {
                const fileBuffer = await fs.promises.readFile(filePath);
                const ext = path.extname(filename).toLowerCase();
                let contentType = "application/pdf";
                if (ext === ".png") contentType = "image/png";
                if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
                if (ext === ".webp") contentType = "image/webp";

                return new Response(fileBuffer, {
                    headers: {
                        "Content-Type": contentType,
                        "Content-Disposition": `inline; filename="${cleanTitle}${ext}"`,
                        "Content-Length": fileBuffer.length.toString(),
                        "Cache-Control": "public, max-age=3600",
                    },
                });
            }
        }

        // 3. If stored as external HTTP / Vercel Blob URL
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return NextResponse.redirect(url);
        }

        // 4. Default fallback: Redirect to the URL
        return NextResponse.redirect(new URL(url, req.url));
    } catch (err: any) {
        console.error("View file error:", err);
        return new NextResponse("Unable to load file preview", { status: 500 });
    }
}
