import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "HOD" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { status, feedback } = body;

        if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const resolvedParams = await params;
        const resourceId = parseInt(resolvedParams.id);
        if (isNaN(resourceId)) return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });

        const data: any = { status };
        if (status === "REJECTED" && feedback) {
            data.feedback = feedback;
        }

        const resource = await prisma.resource.update({
            where: { id: resourceId },
            data
        });

        // Notify lecturer about the status change
        await prisma.notification.create({
            data: {
                userId: resource.lecturerId,
                message: `Your resource "${resource.title}" was ${status.toLowerCase()} by your Head of Department.`,
            }
        });

        return NextResponse.json(resource);
    } catch (error) {
        console.error("Failed to update resource status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
