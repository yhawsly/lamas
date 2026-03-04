import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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
