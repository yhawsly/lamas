import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasDeoPrivileges } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { headers, cookies } from "next/headers";

// PATCH /api/deo/resources/[id] — DEO Approves, Rejects, or Modifies a resource
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (!hasDeoPrivileges(role)) {
            return NextResponse.json({ error: "Forbidden: DEO privileges required" }, { status: 403 });
        }

        const body = await req.json();
        const { status, feedback } = body;

        if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return NextResponse.json({ error: "Invalid status: must be APPROVED, REJECTED, or PENDING" }, { status: 400 });
        }

        const resolvedParams = await params;
        const resourceId = parseInt(resolvedParams.id);
        if (isNaN(resourceId)) {
            return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
        }

        const existingResource = await prisma.resource.findUnique({
            where: { id: resourceId },
            include: { lecturer: true }
        });

        if (!existingResource) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }

        const data: any = { status };
        if (status === "REJECTED" && feedback) {
            data.description = existingResource.description 
                ? `${existingResource.description}\n[DEO Note: ${feedback}]`
                : `[DEO Note: ${feedback}]`;
        }

        const updated = await prisma.resource.update({
            where: { id: resourceId },
            data,
            include: {
                lecturer: { select: { id: true, name: true, email: true } }
            }
        });

        // Notify lecturer about the DEO moderation decision
        const statusLabel = status === "APPROVED" ? "approved" : status === "REJECTED" ? "requested for revision" : "marked pending";
        await prisma.notification.create({
            data: {
                userId: updated.lecturerId,
                message: `Your resource "${updated.title}" was ${statusLabel} by Department Exam Officer (DEO).${feedback ? ` Feedback: "${feedback}"` : ""}`,
            }
        });

        // Audit Log
        await logAction({
            userId: parseInt(session.user.id!),
            action: "RESOURCE_MODERATED",
            details: `DEO marked resource #${resourceId} (${updated.title}) as ${status}${feedback ? ` with note: "${feedback}"` : ""}`
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update resource moderation status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
