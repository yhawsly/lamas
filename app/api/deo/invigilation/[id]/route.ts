import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { assertTermIsActive } from "@/lib/term-guard";

export const dynamic = "force-dynamic";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await headers();
    await cookies();
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user as any).role;
        if (!["DEO", "HOD", "ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const slotId = parseInt(id);

        const existing = await prisma.examSessionInvigilation.findUnique({
            where: { id: slotId }
        });

        if (!existing) {
            return NextResponse.json({ error: "Exam invigilation slot not found" }, { status: 404 });
        }

        // Enforce archive protection
        await assertTermIsActive(existing.termId);

        await prisma.examSessionInvigilation.delete({
            where: { id: slotId }
        });

        return NextResponse.json({ success: true, message: "Exam session removed" });

    } catch (error: any) {
        console.error("Failed to delete slot:", error);
        return NextResponse.json({ error: error.message || "Failed to remove slot" }, { status: 500 });
    }
}
