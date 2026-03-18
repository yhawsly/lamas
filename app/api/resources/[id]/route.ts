import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "SUPER_ADMIN", "HOD"].includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const resId = parseInt(id);
    const body = await req.json();
    const { status } = body; // APPROVED | REJECTED

    const resource = await prisma.resource.update({
        where: { id: resId },
        data: { status },
    });

    // Notify the lecturer
    await prisma.notification.create({
        data: {
            userId: resource.lecturerId,
            message: `Your resource "${resource.title}" has been ${status.toLowerCase()}.`,
        },
    });

    return NextResponse.json(resource);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    await headers();
    await cookies();
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = parseInt(session.user.id!);
    const role = (session.user as any).role;
    const { id } = await context.params;
    const resId = parseInt(id);

    const resource = await prisma.resource.findUnique({
        where: { id: resId },
    });

    if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    // Authorization check: Only owner or ADMIN can delete
    if (resource.lecturerId !== userId && !["ADMIN", "SUPER_ADMIN"].includes(role)) {
        return NextResponse.json({ error: "Forbidden: You can only delete your own resources" }, { status: 403 });
    }

    await prisma.resource.delete({
        where: { id: resId },
    });

    return NextResponse.json({ success: true, message: "Resource deleted successfully" });
}
